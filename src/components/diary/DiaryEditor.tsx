"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import type { DiaryEntry } from "@/stores/diary";
import { useDiaryStore, extractMentions } from "@/stores/diary";
import { useTagsStore } from "@/stores/tags";
import { X, Copy, AtSign, Trash2 } from "lucide-react";
import { MilkdownEditor, type MilkdownEditorRef } from "./MilkdownEditor";

interface DiaryEditorProps {
  entry: DiaryEntry | null;
  isNew: boolean;
  onClose: () => void;
}

interface DailySummary {
  summary: string;
  totalCommits: number;
  aiCost: number;
  netLines: number;
  projects: {
    name: string;
    commits: number;
    additions: number;
    deletions: number;
    netLines: number;
    label: string;
  }[];
}

function generateId(): string {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
  );
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function DiaryEditor({ entry, isNew, onClose }: DiaryEditorProps) {
  const { addEntry, updateEntry, removeEntry } = useDiaryStore();
  const { getAllTags, getAllProjects, addTag, addProject } = useTagsStore();

  const [date, setDate] = useState(entry?.date ?? getTodayStr());
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const editorRef = useRef<MilkdownEditorRef>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(() => setSummaryLoading(true));
    fetch(`/api/diary/summary?date=${date}`)
      .then((r) => r.json())
      .then((data: DailySummary) => {
        if (!cancelled) setDailySummary(data);
      })
      .catch(() => {
        if (!cancelled) setDailySummary(null);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const insertMention = (project: string) => {
    // For Milkdown, we rely on the user typing @project in the editor
    // This button inserts text via clipboard as a fallback
    const text = `@${project} `;
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast here
    });
  };

  const handleSave = () => {
    const markdown = editorRef.current?.getMarkdown() ?? content;
    const trimmedContent = markdown.trim();
    if (!trimmedContent) return;

    const mentions = extractMentions(trimmedContent);
    for (const t of tags) {
      addTag(t);
    }
    for (const m of mentions) {
      addProject(m);
    }

    const autoSummary =
      dailySummary && dailySummary.summary !== "无活动"
        ? dailySummary.summary
        : "";

    if (isNew) {
      addEntry({
        id: generateId(),
        date,
        title: title.trim(),
        autoSummary,
        content: trimmedContent,
        tags,
        mentions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else if (entry) {
      updateEntry(entry.id, {
        date,
        title: title.trim(),
        content: trimmedContent,
        tags,
        mentions,
        autoSummary,
      });
    }

    onClose();
  };

  const handleCopyReport = () => {
    const markdown = editorRef.current?.getMarkdown() ?? content;
    const report = `# 周报片段 - ${date}\n\n${markdown}\n\n标签：${tags.join(
      " "
    )}`;
    navigator.clipboard.writeText(report);
  };

  const handleDelete = () => {
    if (!entry) return;
    removeEntry(entry.id);
    onClose();
  };

  return (
    <div className="bg-bg-surface rounded-md shadow-card border border-border-default">
      {/* Header: title + date + close */}
      <div className="px-4 py-3 border-b border-border-default">
        <div className="flex items-center justify-between mb-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入标题..."
            className="text-lg font-medium text-text-primary bg-transparent outline-none placeholder:text-text-muted w-full"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-secondary transition-colors duration-150 shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="text-sm text-text-secondary bg-transparent outline-none [color-scheme:dark]"
        />
      </div>

      {/* Auto Summary */}
      <div className="px-4 py-3 border-b border-border-default">
        <span className="text-xs text-text-muted uppercase tracking-wide">
          自动摘要
        </span>
        <div className="text-sm text-text-secondary font-[family-name:var(--font-data)] mt-1">
          {summaryLoading ? (
            <span className="text-text-muted">加载中...</span>
          ) : dailySummary && dailySummary.summary !== "无活动" ? (
            <div>
              <span className="text-text-secondary">{dailySummary.summary}</span>
              {dailySummary.projects.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {dailySummary.projects.map((p) => (
                    <span
                      key={p.name}
                      className="text-xs px-1.5 py-0.5 rounded bg-bg-hover text-text-muted"
                    >
                      @{p.name} {p.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className="text-text-muted">
              该日期无 Git 活动或 AI 消耗
            </span>
          )}
        </div>
      </div>

      {/* Editor Area — Milkdown WYSIWYG */}
      <div className="p-4">
        <MilkdownEditor ref={editorRef} value={content} onChange={setContent} />
      </div>

      {/* @Mention Quick Buttons */}
      <div className="px-4 py-2 border-t border-border-default">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-text-muted flex items-center gap-0.5">
            <AtSign size={12} />
            关联项目（点击复制）：
          </span>
          {getAllProjects().slice(0, 10).map((p) => (
            <button
              key={p}
              onClick={() => insertMention(p)}
              className="text-xs px-2 py-0.5 rounded-full bg-accent-subtle text-accent-text hover:bg-accent hover:text-white transition-colors duration-150"
            >
              @{p}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="px-4 py-3 border-t border-border-default">
        <div className="flex gap-1.5 flex-wrap">
          {getAllTags().map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`
                text-xs px-2 py-0.5 rounded-full transition-colors duration-150
                ${
                  tags.includes(tag)
                    ? "bg-accent text-white"
                    : "bg-bg-hover text-text-secondary hover:text-text-primary"
                }
              `}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
          >
            <Copy size={12} />
            复制为周报
          </button>

          {!isNew && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-error">确认删除？</span>
                  <button
                    onClick={handleDelete}
                    className="text-xs px-2 py-0.5 bg-error text-white rounded-sm transition-colors duration-150 hover:opacity-80"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition-colors duration-150"
                >
                  <Trash2 size={12} />
                  删除
                </button>
              )}
            </>
          )}
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover"
        >
          保存
        </button>
      </div>
    </div>
  );
}
