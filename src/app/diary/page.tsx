"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useDiaryStore } from "@/stores/diary";
import { DiaryEditor } from "@/components/diary/DiaryEditor";
import { ExpandableDiaryCard } from "@/components/diary/ExpandableDiaryCard";
import { DiarySidebar } from "@/components/diary/DiarySidebar";
import { useTagsStore } from "@/stores/tags";
import { Plus, BookOpen, Search, X, AtSign, FileText } from "lucide-react";
import { WeeklyReportModal } from "@/components/diary/WeeklyReportModal";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { DiaryCardSkeleton } from "@/components/ui/Skeleton";

export default function DiaryPage() {
  const { entries, activeEntryId, setActiveEntry, setEntries } = useDiaryStore();
  const { getAllTags, getAllProjects, _hasHydrated } = useTagsStore();
  const allTags = _hasHydrated ? getAllTags() : [];
  const allProjects = _hasHydrated ? getAllProjects() : [];
  const [isNew, setIsNew] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [, startTransition] = useTransition();
  
  // 当筛选条件变化时，重置页码
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [searchQuery, activeTag, activeProject, dateFrom, dateTo]);

  // 快捷键：Ctrl+N 新建日记，Ctrl+/ 聚焦搜索
  useKeyboardShortcut({
    key: "n",
    modifier: "ctrl",
    callback: () => {
      setActiveEntry(null);
      setIsNew(true);
    },
  });
  useKeyboardShortcut({
    key: "/",
    modifier: "ctrl",
    callback: () => {
      document.querySelector<HTMLInputElement>('input[placeholder*="搜索"]')?.focus();
    },
  });

  const handleSearch = () => {
    const q = searchInput.trim();
    if (q === searchQuery) return;
    setSearchQuery(q);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder*="搜索"]');
      input?.focus();
    }, 0);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
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
    if (activeTag) result = result.filter((e) => e.tags.includes(activeTag));
    if (activeProject) result = result.filter((e) => e.mentions.includes(activeProject));
    if (dateFrom) result = result.filter((e) => e.date >= dateFrom);
    if (dateTo) result = result.filter((e) => e.date <= dateTo);
    return result;
  }, [entries, searchQuery, activeTag, activeProject, dateFrom, dateTo]);


  // 分页计算
  const totalItems = filteredEntries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  // 页码列表（最多显示 5 个页码）
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    
    return pages;
  };

  const mentionedProjects = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) for (const m of e.mentions) s.add(m);
    return [...s];
  }, [entries]);

  return (
    <div className="flex gap-8 pl-6 pr-[50px] py-8 w-full">
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

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-text-primary">日记</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-default rounded-sm text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors duration-150"
            >
              <FileText size={14} />
              生成报告
            </button>
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
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex gap-2 max-w-[480px]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
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

        {/* New Entry Editor */}
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

        {/* Card Stream */}
        {loading ? (
          <div className="space-y-3">
            <DiaryCardSkeleton />
            <DiaryCardSkeleton />
            <DiaryCardSkeleton />
          </div>
        ) : totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-text-muted">
            <BookOpen size={40} className="mb-4 opacity-40" />
            <p className="text-sm">
              {entries.length === 0 ? "写下第一篇日记" : "无匹配结果"}
            </p>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="text-xs text-text-muted mb-3">
              显示 {startIndex + 1}-{endIndex} 条，共 {totalItems} 篇日记
            </div>
            
            <div className="space-y-3">
              {currentEntries.map((entry) => {
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <span>每页</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-bg-surface border border-border-default rounded text-text-primary text-xs"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>条</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-2 py-1 text-xs border border-border-default rounded hover:border-accent transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>

                  {getPageNumbers().map((page, idx) =>
                    typeof page === "string" ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs text-text-muted">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2.5 py-1 text-xs border rounded transition-colors duration-150 ${
                          safePage === page
                            ? "bg-accent text-white border-accent"
                            : "border-border-default hover:border-accent"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-2 py-1 text-xs border border-border-default rounded hover:border-accent transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>

                <div className="text-xs text-text-muted">
                  第 {safePage} / {totalPages} 页
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Weekly Report Modal */}
      {showReport && <WeeklyReportModal onClose={() => setShowReport(false)} />}
    </div>
  );
}
