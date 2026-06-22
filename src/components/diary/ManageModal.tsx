"use client";

import { useState } from "react";
import { useTagsStore } from "@/stores/tags";
import { useDiaryStore } from "@/stores/diary";
import { X, Trash2, Pencil, Check } from "lucide-react";

interface Props {
  type: "tags" | "projects";
  onClose: () => void;
}

export function ManageModal({ type, onClose }: Props) {
  const {
    getAllTags, getAllProjects,
    removeTag, removeProject,
    renameTag, renameProject,
  } = useTagsStore();
  const { updateEntry, entries } = useDiaryStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const items = type === "tags" ? getAllTags() : getAllProjects();
  const title = type === "tags" ? "管理标签" : "管理项目";

  const handleDelete = (item: string) => {
    if (type === "tags") {
      removeTag(item);
      // Remove tag from all entries
      for (const entry of entries) {
        if (entry.tags.includes(item)) {
          updateEntry(entry.id, { tags: entry.tags.filter((t) => t !== item) });
        }
      }
    } else {
      removeProject(item);
      // Remove mention from all entries
      for (const entry of entries) {
        if (entry.mentions.includes(item)) {
          updateEntry(entry.id, { mentions: entry.mentions.filter((m) => m !== item) });
        }
      }
    }
  };

  const handleRename = (oldName: string) => {
    const newName = editValue.trim();
    if (!newName || newName === oldName) { setEditing(null); return; }

    if (type === "tags") {
      renameTag(oldName, newName);
      // Rename in all entries
      for (const entry of entries) {
        if (entry.tags.includes(oldName)) {
          updateEntry(entry.id, {
            tags: entry.tags.map((t) => (t === oldName ? newName : t)),
          });
        }
      }
    } else {
      renameProject(oldName, newName);
      for (const entry of entries) {
        if (entry.mentions.includes(oldName)) {
          updateEntry(entry.id, {
            mentions: entry.mentions.map((m) => (m === oldName ? newName : m)),
          });
        }
      }
    }
    setEditing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-bg-elevated rounded-lg shadow-elevated border border-border-emphasis w-80 max-h-[480px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <h3 className="text-sm font-medium text-text-primary">{title}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors duration-150">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {items.length === 0 ? (
            <div className="text-xs text-text-muted text-center py-8">暂无{type === "tags" ? "标签" : "项目"}</div>
          ) : (
            items.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between px-2 py-1.5 rounded-sm hover:bg-bg-hover group"
              >
                {editing === item ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(item)}
                      className="flex-1 px-1 py-0.5 bg-transparent border border-accent rounded-sm text-xs text-text-primary outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleRename(item)} className="p-0.5 text-accent hover:text-accent-hover">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditing(null)} className="p-0.5 text-text-muted hover:text-text-secondary">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-text-primary">{item}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={() => { setEditing(item); setEditValue(item); }}
                        className="p-0.5 text-text-muted hover:text-text-secondary"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-0.5 text-text-muted hover:text-error"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
