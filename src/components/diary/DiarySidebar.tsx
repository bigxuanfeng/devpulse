"use client";

import { useState, useMemo } from "react";
import type { DiaryEntry } from "@/stores/diary";
import { useTagsStore } from "@/stores/tags";
import { DateRangePicker } from "@/components/diary/DateRangePicker";
import { ManageModal } from "@/components/diary/ManageModal";
import { SortableList } from "@/components/diary/SortableList";
import { AtSign, Hash, Plus, Settings2 } from "lucide-react";

interface Props {
  entries: DiaryEntry[];
  activeTag: string | null;
  activeProject: string | null;
  dateFrom: string;
  dateTo: string;
  onTagClick: (tag: string | null) => void;
  onProjectClick: (project: string | null) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

export function DiarySidebar({
  entries,
  activeTag,
  activeProject,
  dateFrom,
  dateTo,
  onTagClick,
  onProjectClick,
  onDateFromChange,
  onDateToChange,
}: Props) {
  const {
    addTag, addProject, getAllTags, getAllProjects,
    reorderTags, reorderProjects, _hasHydrated,
  } = useTagsStore();
  const [newTag, setNewTag] = useState("");
  const [newProject, setNewProject] = useState("");
  const [manageType, setManageType] = useState<"tags" | "projects" | null>(null);

  const allTags = useMemo(() => _hasHydrated ? getAllTags() : [], [_hasHydrated]);
  const allProjects = useMemo(() => _hasHydrated ? getAllProjects() : [], [_hasHydrated]);

  // Also collect projects from @mentions in entries
  const mentionedProjects = useMemo(() => {
    const set = new Set(allProjects);
    for (const e of entries) {
      for (const m of e.mentions) set.add(m);
    }
    return [...set];
  }, [entries, allProjects]);

  const tagCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of allTags) {
      const count = entries.filter((e) => e.tags.includes(t)).length;
      map[t] = count;
    }
    return map;
  }, [entries, allTags]);

  const projectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of mentionedProjects) {
      const count = entries.filter((e) => e.mentions.includes(p)).length;
      map[p] = count;
    }
    return map;
  }, [entries, mentionedProjects]);

  const handleAddTag = () => {
    const t = newTag.trim();
    if (!t) return;
    const formatted = t.startsWith("#") ? t : `#${t}`;
    addTag(formatted);
    setNewTag("");
    // Don't auto-select - just add to list
  };

  const handleAddProject = () => {
    const p = newProject.trim();
    if (!p) return;
    addProject(p);
    setNewProject("");
  };

  return (
    <div className="w-52 shrink-0 space-y-6">
      {/* Time Range */}
      <section>
        <h3 className="text-xs text-text-muted uppercase tracking-wide mb-2">时间</h3>
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          onClear={() => { onDateFromChange(""); onDateToChange(""); }}
        />
      </section>

      {/* Tags */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Hash size={12} /> 标签
          </h3>
          <button
            onClick={() => setManageType("tags")}
            className="text-text-muted hover:text-text-secondary transition-colors duration-150"
          >
            <Settings2 size={12} />
          </button>
        </div>
        <div className="space-y-0.5 mb-2">
          <SortableList
            id="diary-tags"
            items={allTags}
            onReorder={reorderTags}
            renderItem={(tag) => (
              <button
                onClick={() => onTagClick(activeTag === tag ? null : tag)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-sm text-sm transition-colors duration-150 ${
                  activeTag === tag
                    ? "bg-accent-subtle text-accent-text"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                <span className="truncate">{tag}</span>
                <span className="text-xs text-text-muted shrink-0 ml-1">{tagCounts[tag] || 0}</span>
              </button>
            )}
          />
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
            placeholder="新标签..."
            className="flex-1 px-2 py-1 bg-transparent border border-border-default rounded-sm text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            className="p-1 text-text-muted hover:text-accent disabled:opacity-30 transition-colors duration-150"
          >
            <Plus size={14} />
          </button>
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <AtSign size={12} /> 项目
          </h3>
          <button
            onClick={() => setManageType("projects")}
            className="text-text-muted hover:text-text-secondary transition-colors duration-150"
          >
            <Settings2 size={12} />
          </button>
        </div>
        <div className="space-y-0.5 mb-2">
          <SortableList
            id="diary-projects"
            items={mentionedProjects}
            onReorder={reorderProjects}
            renderItem={(project) => (
              <button
                onClick={() => onProjectClick(activeProject === project ? null : project)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-sm text-sm transition-colors duration-150 ${
                  activeProject === project
                    ? "bg-accent-subtle text-accent-text"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                <span className="truncate">{project}</span>
                <span className="text-xs text-text-muted shrink-0 ml-1">{projectCounts[project] || 0}</span>
              </button>
            )}
          />
        </div>
        <div className="flex gap-1">
          <input
            type="text"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddProject()}
            placeholder="新项目..."
            className="flex-1 px-2 py-1 bg-transparent border border-border-default rounded-sm text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
          />
          <button
            onClick={handleAddProject}
            disabled={!newProject.trim()}
            className="p-1 text-text-muted hover:text-accent disabled:opacity-30 transition-colors duration-150"
          >
            <Plus size={14} />
          </button>
        </div>
      </section>

      {/* Management Modal */}
      {manageType && (
        <ManageModal
          type={manageType}
          onClose={() => setManageType(null)}
        />
      )}
    </div>
  );
}
