"use client";

import { useState, useEffect, useMemo } from "react";
import { useDiaryStore } from "@/stores/diary";
import { DiaryCard } from "@/components/diary/DiaryCard";
import { DiaryEditor } from "@/components/diary/DiaryEditor";
import { ExpandableDiaryCard } from "@/components/diary/ExpandableDiaryCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { useTagsStore } from "@/stores/tags";
import { Plus, BookOpen, Search, X, AtSign } from "lucide-react";

export default function DiaryPage() {
  const { entries, activeEntryId, setActiveEntry, setEntries } = useDiaryStore();
  const { getAllTags, getAllProjects, _hasHydrated } = useTagsStore();
  const allTags = _hasHydrated ? getAllTags() : [];
  const allProjects = _hasHydrated ? getAllProjects() : [];
  const [isNew, setIsNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchInput, setSearchInput] = useState("");     // what the user is typing
  const [searchQuery, setSearchQuery] = useState("");     // confirmed query for filtering
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const handleSearch = () => {
    const q = searchInput.trim();
    if (q === searchQuery) return; // no change, don't re-render
    setSearchQuery(q);
    // Keep focus after search
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="搜索"]');
      input?.focus();
    }, 0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
    // Keep focus on input
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="搜索"]');
      input?.focus();
    }, 0);
  };

  useEffect(() => {
    fetch("/api/diary")
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [setEntries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let result = entries;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.content.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)) ||
          e.mentions.some((m) => m.toLowerCase().includes(q))
      );
    }

    if (activeTag) {
      result = result.filter((e) => e.tags.includes(activeTag));
    }

    if (activeProject) {
      result = result.filter((e) => e.mentions.includes(activeProject));
    }

    if (dateFrom) result = result.filter((e) => e.date >= dateFrom);
    if (dateTo) result = result.filter((e) => e.date <= dateTo);

    return result;
  }, [entries, searchQuery, activeTag, activeProject, dateFrom, dateTo]);

  const activeEntry = activeEntryId
    ? entries.find((e) => e.id === activeEntryId)
    : null;

  // Collect unique projects from all entries for filter pills
  const mentionedProjects = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const m of e.mentions) set.add(m);
    }
    return [...set];
  }, [entries]);

  return (
    <div className="flex gap-8 pl-6 pr-[50px] py-8 w-full">
      {/* Sidebar - flush left */}
      <DiarySidebar
        entries={entries}
        activeTag={activeTag}
        activeProject={activeProject}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onTagClick={setActiveTag}
        onProjectClick={setActiveProject}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Main Content - centered in remaining space */}
      <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">日记</h1>
        <button
          onClick={() => {
            setActiveEntry(null);
            setIsNew(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover"
        >
          <Plus size={16} />
          新日记
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex gap-2 max-w-[480px]">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索日记内容、标签、项目..."
              className="w-full pl-9 pr-8 py-2 bg-bg-surface border border-border-default rounded-md text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent transition-colors duration-150"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-bg-surface border border-border-default rounded-md text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors duration-150"
          >
            搜索
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Tag filters */}
        <span className="text-xs text-text-muted self-center mr-1">标签：</span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-150 ${
              activeTag === tag
                ? "bg-accent text-white"
                : "bg-bg-hover text-text-secondary hover:text-text-primary"
            }`}
          >
            {tag}
          </button>
        ))}

        <span className="text-xs text-text-muted self-center ml-3 mr-1">项目：</span>
        {/* Project filters - show all tracked + mentioned */}
        {allProjects.map((p) => (
          <button
            key={p}
            onClick={() => setActiveProject(activeProject === p ? null : p)}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-150 flex items-center gap-1 ${
              activeProject === p
                ? "bg-accent text-white"
                : "bg-accent-subtle text-accent-text hover:bg-accent hover:text-white"
            }`}
          >
            <AtSign size={10} />
            {p}
          </button>
        ))}
        {mentionedProjects
          .filter((p) => !allProjects.includes(p))
          .map((p) => (
            <button
              key={p}
              onClick={() => setActiveProject(activeProject === p ? null : p)}
              className={`text-xs px-2 py-0.5 rounded-full transition-colors duration-150 flex items-center gap-1 ${
                activeProject === p
                  ? "bg-accent text-white"
                  : "bg-accent-subtle text-accent-text hover:bg-accent hover:text-white"
              }`}
            >
              <AtSign size={10} />
              {p}
            </button>
          ))}

        {/* Clear all filters */}
        {(searchQuery || activeTag || activeProject) && (
          <button
            onClick={() => {
              clearSearch();
              setActiveTag(null);
              setActiveProject(null);
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
          >
            <X size={12} />
            清除筛选
          </button>
        )}
      </div>

      {/* New Entry Editor (only for brand-new diaries) */}
      {isNew && (
        <div className="mb-8">
          <DiaryEditor
            entry={null}
            isNew={true}
            onClose={() => {
              setIsNew(false);
              setActiveEntry(null);
            }}
          />
        </div>
      )}

      {/* Results count */}
      {(searchQuery || activeTag || activeProject) && (
        <div className="text-xs text-text-muted mb-3">
          找到 {filteredEntries.length} 篇日记
        </div>
      )}

      {/* Card Stream */}
      {loading ? (
        <div className="text-text-muted text-sm">加载中...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted">
          <BookOpen size={40} className="mb-4 opacity-40" />
          <p className="text-sm">
            {entries.length === 0 ? "写下第一篇日记" : "无匹配结果"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const isExpanded = activeEntryId === entry.id;
            return (
              <ExpandableDiaryCard
                key={entry.id}
                entry={entry}
                isExpanded={isExpanded}
                searchQuery={searchQuery}
                onClick={() => {
                  setIsNew(false);
                  setActiveEntry(isExpanded ? null : entry.id);
                }}
                onClose={() => setActiveEntry(null)}
              />
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
