import type { DiaryEntry } from "@/stores/diary";
import { Pencil, AtSign } from "lucide-react";

const TAG_DOT_COLORS: Record<string, string> = {
  "#踩坑": "text-error",
  "#架构决策": "text-accent",
  "#性能优化": "text-success",
  "#学到了": "text-info",
  "#想法": "text-warning",
  "#部署": "text-info",
  "#重构": "text-success",
};

interface DiaryCardProps {
  entry: DiaryEntry;
  onClick: () => void;
  searchQuery?: string;
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

export function DiaryCard({ entry, onClick, searchQuery }: DiaryCardProps) {
  // Build summary line from mentions and tags
  const summaryParts: string[] = [];
  if (entry.mentions.length > 0) {
    summaryParts.push(entry.mentions.map((m) => `@${m}`).join(" "));
  }
  const summaryLine = summaryParts.join(" · ");

  return (
    <div
      onClick={onClick}
      className="bg-bg-surface rounded-md p-4 shadow-card border border-border-default cursor-pointer transition-all duration-250 hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-medium text-text-primary">
          {entry.date}
        </span>
        <span className="text-xs text-text-muted flex items-center gap-1">
          <Pencil size={12} />
          编辑
        </span>
      </div>

      <div className="border-t border-border-default mb-2" />

      {/* Mention line */}
      {summaryLine && (
        <div className="flex items-center gap-1 text-xs text-accent mb-2 flex-wrap">
          <AtSign size={11} />
          {entry.mentions.map((m) => (
            <span key={m} className="bg-accent-subtle text-accent-text rounded-full px-2 py-0.5">
              {m}
            </span>
          ))}
        </div>
      )}

      {entry.autoSummary && (
        <div className="text-sm text-text-secondary font-[family-name:var(--font-editor)] mb-2">
          {entry.autoSummary}
        </div>
      )}

      {entry.content && (
        <div className="text-base text-text-primary line-clamp-2 mb-2">
          {searchQuery ? highlightText(entry.content, searchQuery) : entry.content}
        </div>
      )}

      {entry.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-xs text-text-secondary bg-bg-hover rounded-full px-2 py-0.5"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  TAG_DOT_COLORS[tag] ?? "text-text-muted"
                } bg-current`}
              />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
