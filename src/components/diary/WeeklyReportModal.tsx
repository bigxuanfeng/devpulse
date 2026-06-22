"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { X, Copy, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

interface WeeklyReportModalProps {
  onClose: () => void;
}

type ReportMode = "week" | "month";

export default function WeeklyReportModal({ onClose }: WeeklyReportModalProps) {
  const [mode, setMode] = useState<ReportMode>("week");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [summary, setSummary] = useState<null | {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    netLines: number;
    totalAiCost: number;
    diaryCount: number;
    activeDays: number;
  }>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  // 快捷键：Escape 关闭
  useKeyboardShortcut({
    key: "Escape",
    callback: () => onClose(),
  });

  const fetchReport = useCallback(() => {
    startTransition(() => { setLoading(true); setError(""); });
    fetch(`/api/diary/weekly-report?mode=${mode}&date=${date}`)
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => {
        startTransition(() => {
          setMarkdown(data.markdown || "");
          setSummary(data.summary || null);
        });
      })
      .catch((e: Error) => {
        startTransition(() => setError(e.message || "生成失败"));
      })
      .finally(() => startTransition(() => setLoading(false)));
  }, [mode, date]);

  // Auto-fetch on mount and when mode/date changes
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
  };

  const handleExport = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devpulse-${mode}-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shiftDate = (dir: number) => {
    const d = new Date(date + "T00:00:00");
    if (mode === "week") {
      d.setDate(d.getDate() + dir * 7);
    } else {
      d.setMonth(d.getMonth() + dir);
    }
    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  };

  const displayRange = summary
    ? mode === "week"
      ? `${date} 所在周`
      : `${date.slice(0, 7)}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs" onClick={onClose}>
      <div
        className="bg-bg-root rounded-lg border border-border-default shadow-elevated w-full max-w-[800px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border-default">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">开发报告</h2>
            {/* Mode toggle */}
            <div className="flex items-center bg-bg-hover rounded-md p-0.5 text-xs">
              <button
                onClick={() => setMode("week")}
                className={`px-2.5 py-1 rounded-sm transition-colors duration-150 ${
                  mode === "week" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                周报
              </button>
              <button
                onClick={() => setMode("month")}
                className={`px-2.5 py-1 rounded-sm transition-colors duration-150 ${
                  mode === "month" ? "bg-accent text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                月报
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors duration-150">
            <X size={18} />
          </button>
        </div>

        {/* Date selector */}
        <div className="flex items-center justify-center gap-3 px-5 py-2 border-b border-border-default bg-bg-surface">
          <button onClick={() => shiftDate(-1)} className="p-1 text-text-muted hover:text-text-primary transition-colors duration-150">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-text-secondary font-[family-name:var(--font-data)] min-w-[120px] text-center">
            {displayRange}
          </span>
          <button onClick={() => shiftDate(1)} className="p-1 text-text-muted hover:text-text-primary transition-colors duration-150">
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => {
              const d = new Date();
              setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
            }}
            className="text-xs text-accent hover:text-accent-hover transition-colors duration-150 ml-2"
          >
            今天
          </button>
        </div>

        {/* Summary stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 border-b border-border-default bg-bg-surface">
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary font-[family-name:var(--font-data)]">
                {summary.totalCommits}
              </div>
              <div className="text-xs text-text-muted">提交数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary font-[family-name:var(--font-data)]">
                {summary.netLines >= 0 ? "+" : ""}{summary.netLines}
              </div>
              <div className="text-xs text-text-muted">净增行数</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary font-[family-name:var(--font-data)]">
                ¥{summary.totalAiCost.toFixed(4)}
              </div>
              <div className="text-xs text-text-muted">AI 花费</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-text-primary font-[family-name:var(--font-data)]">
                {summary.diaryCount}
              </div>
              <div className="text-xs text-text-muted">日记篇数</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="text-text-muted text-sm text-center py-12">生成中...</div>
          ) : error ? (
            <div className="text-error text-sm text-center py-12">{error}</div>
          ) : (
            <pre className="text-sm text-text-primary font-[family-name:var(--font-editor)] whitespace-pre-wrap leading-relaxed">
              {markdown}
            </pre>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-default bg-bg-surface">
          <div className="text-xs text-text-muted">
            {summary && `${summary.activeDays} 个活跃开发日`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!markdown}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-default rounded-sm text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors duration-150 disabled:opacity-40"
            >
              <Copy size={14} />
              复制 Markdown
            </button>
            <button
              onClick={handleExport}
              disabled={!markdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-sm text-sm font-medium transition-colors duration-150 hover:bg-accent-hover disabled:opacity-40"
            >
              导出 .md
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
