"use client";

import { useState, useRef } from "react";
import type { DiaryEntry } from "@/stores/diary";
import { useDiaryStore } from "@/stores/diary";
import { useTagsStore } from "@/stores/tags";
import { AtSign, X, Copy, Trash2, Hash, Plus } from "lucide-react";

const TAG_DOT_COLORS: Record<string, string> = {
  "#踩坑": "text-error", "#架构决策": "text-accent", "#性能优化": "text-success",
  "#学到了": "text-info", "#想法": "text-warning", "#部署": "text-info", "#重构": "text-success",
};

interface Props {
  entry: DiaryEntry;
  isExpanded: boolean;
  searchQuery?: string;
  onClick: () => void;
  onClose: () => void;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-subtle text-accent-text rounded-sm px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function ExpandableDiaryCard({ entry, isExpanded, searchQuery, onClick, onClose }: Props) {
  const { updateEntry, removeEntry } = useDiaryStore();
  const { addTag, addProject } = useTagsStore();
  const [content, setContent] = useState(entry.content);
  const [date, setDate] = useState(entry.date);
  const [title, setTitle] = useState(entry.title ?? "");
  const [tags, setTags] = useState<string[]>(entry.tags);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mentionInput, setMentionInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editMentions, setEditMentions] = useState<string[]>(entry.mentions ?? []);
  const expandedRef = useRef<HTMLDivElement>(null);

  // 当开始编辑时，同步最新数据
  const handleStartEdit = () => {
    setContent(entry.content);
    setDate(entry.date);
    setTitle(entry.title ?? "");
    setTags(entry.tags);
    setEditMentions(entry.mentions ?? []);
    setIsEditing(true);
  };

  const addMention = () => {
    const m = mentionInput.trim();
    if (!m || editMentions.includes(m)) return;
    setEditMentions((prev) => [...prev, m]);
    setMentionInput("");
  };

  const addEditTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    const formatted = t.startsWith("#") ? t : `#${t}`;
    setTags((prev) => (prev.includes(formatted) ? prev : [...prev, formatted]));
    setTagInput("");
  };

  const handleSave = () => {
    if (!content.trim()) return;
    for (const t of tags) { addTag(t); }
    for (const m of editMentions) { addProject(m); }
    updateEntry(entry.id, { date, title: title.trim(), content: content.trim(), tags, mentions: editMentions });
    setIsEditing(false);
  };

  const handleCopyReport = () => {
    const report = `# ${title || date}\n\n${content}\n\n标签：${tags.join(" ")}`;
    navigator.clipboard.writeText(report);
  };

  const handleDelete = () => {
    removeEntry(entry.id);
    onClose();
  };

  const mentions = entry.mentions ?? [];

  return (
    <div
      className={`
        bg-bg-surface rounded-md border transition-all duration-300
        ${isExpanded
          ? "shadow-elevated border-accent"
          : "shadow-card border-border-default hover:-translate-y-0.5 hover:shadow-elevated"
        }
      `}
    >
      {/* ===== PREVIEW HEADER (always visible) ===== */}
      <div onClick={onClick} className="cursor-pointer">
        <div className="px-4 py-3">
          <span className="text-lg font-medium text-text-primary">
            {entry.title || entry.date}
          </span>
          {entry.title && (
            <span className="text-xs text-text-muted ml-2">{entry.date}</span>
          )}
        </div>

        {/* Preview-only content (hidden when expanded) */}
        {!isExpanded && (
          <>
            <div className="border-t border-border-default mx-4" />
            {mentions.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-accent px-4 mt-2 flex-wrap">
                <AtSign size={11} />
                {mentions.map((m) => (
                  <span key={m} className="bg-accent-subtle text-accent-text rounded-full px-2 py-0.5">{m}</span>
                ))}
              </div>
            )}
            {entry.content && (
              <div className="text-base text-text-primary line-clamp-2 px-4 my-2">
                {searchQuery ? highlightText(entry.content, searchQuery) : entry.content}
              </div>
            )}
            {entry.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap px-4 pb-3">
                {entry.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs text-text-secondary bg-bg-hover rounded-full px-2 py-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${TAG_DOT_COLORS[tag] ?? "text-text-muted"} bg-current`} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {!entry.content && !mentions.length && !entry.tags.length && <div className="h-1" />}
          </>
        )}
      </div>

      {/* ===== EXPANDED VIEW / EDITOR ===== */}
      <div
        ref={expandedRef}
        className={`
          overflow-hidden transition-all duration-300 ease-standard
          ${isExpanded ? "max-h-[1600px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="border-t border-border-default" />

        {/* Header: title + date + close */}
        <div className="px-4 py-3 border-b border-border-default">
          <div className="flex items-center justify-between mb-2">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入标题..."
                className="text-lg font-medium text-text-primary bg-transparent outline-none placeholder:text-text-muted w-full"
                autoFocus
              />
            ) : (
              <span className="text-lg font-medium text-text-primary">{entry.title || entry.date}</span>
            )}
            <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors duration-150 shrink-0 ml-2">
              <X size={18} />
            </button>
          </div>
          {isEditing ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm text-text-secondary bg-transparent outline-none [color-scheme:dark]"
            />
          ) : (
            <span className="text-sm text-text-secondary">{entry.date}</span>
          )}
        </div>

        {/* Auto Summary */}
        <div className="px-4 py-3 border-b border-border-default">
          <span className="text-xs text-text-muted uppercase tracking-wide">自动摘要</span>
          <div className="text-sm text-text-secondary font-[family-name:var(--font-editor)] mt-1">
            暂无自动数据 — 连接 Git 和 API 后将自动生成
          </div>
        </div>

        {/* Content: view mode or edit mode */}
        <div className="p-4">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写点什么...\n\n用 @项目名 关联项目，例如 @liandainqi"
              className="w-full min-h-[400px] bg-transparent text-base text-text-primary font-[family-name:var(--font-editor)] resize-y outline-none placeholder:text-text-muted"
            />
          ) : (
            <div className="min-h-[200px] text-base text-text-primary font-[family-name:var(--font-editor)] whitespace-pre-wrap">
              {entry.content || <span className="text-text-muted">暂无内容</span>}
            </div>
          )}
        </div>

        {/* Edit mode only: project mentions + tags as inputs */}
        {isEditing && (
          <>
            {/* Project Mentions */}
            <div className="px-4 py-2 border-t border-border-default">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <AtSign size={12} className="text-text-muted" />
                {editMentions.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 text-xs bg-accent-subtle text-accent-text rounded-full pl-2 pr-1 py-0.5">
                    {m}
                    <button onClick={() => setEditMentions((prev) => prev.filter((x) => x !== m))} className="hover:text-error">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={mentionInput}
                  onChange={(e) => setMentionInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMention()}
                  placeholder="添加项目..."
                  className="flex-1 px-2 py-1 bg-transparent border border-border-default rounded-sm text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
                />
                <button onClick={addMention} disabled={!mentionInput.trim()} className="p-1 text-text-muted hover:text-accent disabled:opacity-30">
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="px-4 py-2 border-t border-border-default">
              <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                <Hash size={12} className="text-text-muted" />
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs bg-accent-subtle text-accent-text rounded-full pl-2 pr-1 py-0.5">
                    {t}
                    <button onClick={() => setTags((prev) => prev.filter((x) => x !== t))} className="hover:text-error">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addEditTag()}
                  placeholder="添加标签..."
                  className="flex-1 px-2 py-1 bg-transparent border border-border-default rounded-sm text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent"
                />
                <button onClick={addEditTag} disabled={!tagInput.trim()} className="p-1 text-text-muted hover:text-accent disabled:opacity-30">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* View mode: show tags & mentions */}
        {!isEditing && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {entry.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs text-text-secondary bg-bg-hover rounded-full px-2 py-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${TAG_DOT_COLORS[tag] ?? "text-text-muted"} bg-current`} />
                {tag}
              </span>
            ))}
            {entry.mentions.map((m) => (
              <span key={m} className="inline-flex items-center gap-1 text-xs text-accent bg-accent-subtle rounded-full px-2 py-0.5">
                <AtSign size={10} />{m}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-default">
          <div className="flex items-center gap-3">
            {isEditing && (
              <button onClick={handleCopyReport} className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors duration-150">
                <Copy size={12} />复制为周报
              </button>
            )}
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">确认删除？</span>
                <button onClick={handleDelete} className="text-xs px-2 py-0.5 bg-error text-white rounded-sm transition-colors duration-150 hover:opacity-80">删除</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150">取消</button>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 text-xs text-text-muted hover:text-error transition-colors duration-150">
                <Trash2 size={12} />删除
              </button>
            )}
          </div>

          {isEditing ? (
            <button onClick={handleSave} disabled={!content.trim()} className="px-4 py-1.5 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed">
              保存
            </button>
          ) : (
            <button
              onClick={handleStartEdit}
              className="px-4 py-1.5 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover"
            >
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
