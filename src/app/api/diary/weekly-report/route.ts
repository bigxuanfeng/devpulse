import fs from "fs";
import path from "path";
import type { DiaryEntry } from "@/stores/diary";
import { getDailyGitSummary } from "@/lib/data/git-collector";
import { getDailyCost } from "@/lib/data/ai-usage";

interface StoredData {
  entries: DiaryEntry[];
}

function readDiaryData(): StoredData {
  try {
    const filePath = path.join(process.cwd(), "data", "diary.json");
    if (!fs.existsSync(filePath)) return { entries: [] };
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error("[weekly-report API] Failed to read diary data:", err);
    return { entries: [] };
  }
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  return { start: fmt(monday), end: fmt(sunday) };
}

function getMonthRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr + "T00:00:00");
  const y = d.getFullYear();
  const m = d.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  return {
    start: fmt(new Date(y, m, 1)),
    end: fmt(new Date(y, m, lastDay)),
  };
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "week"; // "week" | "month"
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const range = mode === "month" ? getMonthRange(date) : getWeekRange(date);

  // Fetch diary entries in range
  const data = readDiaryData();
  const entries = (data.entries ?? []).filter(
    (e) => e.date >= range.start && e.date <= range.end
  );

  // Aggregate git + AI data per day
  let totalCommits = 0;
  let totalAdditions = 0;
  let totalDeletions = 0;
  let totalAiCost = 0;
  const activeDaysSet = new Set<string>();
  const projectCommits: Record<string, number> = {};

  for (let d = new Date(range.start + "T00:00:00"); d <= new Date(range.end + "T00:00:00"); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const gitSummary = getDailyGitSummary(dateStr);
    if (gitSummary.totalCommits > 0) {
      totalCommits += gitSummary.totalCommits;
      totalAdditions += gitSummary.totalAdditions;
      totalDeletions += gitSummary.totalDeletions;
      activeDaysSet.add(dateStr);
      for (const p of gitSummary.projects) {
        projectCommits[p.name] = (projectCommits[p.name] || 0) + p.commits;
      }
    }
    totalAiCost += getDailyCost(dateStr);
  }

  const netLines = totalAdditions - totalDeletions;

  // Build markdown report
  const modeLabel = mode === "week" ? "周报" : "月报";
  const dateLabel = mode === "week"
    ? `${range.start} ~ ${range.end}`
    : `${range.start.slice(0, 7)}`;

  const lines: string[] = [];
  lines.push(`# 📊 开发${modeLabel} | ${dateLabel}`);
  lines.push("");
  lines.push("## 概览");
  lines.push(`- 📅 时间范围：${range.start} ~ ${range.end}`);
  lines.push(`- 🔨 提交数：${totalCommits} commits`);
  lines.push(`- 📈 代码变动：+${totalAdditions} / -${totalDeletions} 行（净 ${netLines >= 0 ? "+" : ""}${netLines} 行）`);
  lines.push(`- 🤖 AI 花费：¥${totalAiCost.toFixed(4)}`);
  lines.push(`- 📝 日记：${entries.length} 篇`);
  lines.push("");

  if (Object.keys(projectCommits).length > 0) {
    lines.push("## 项目分布");
    for (const [name, count] of Object.entries(projectCommits)) {
      lines.push(`- **${name}**：${count} commits`);
    }
    lines.push("");
  }

  if (entries.length > 0) {
    lines.push("## 日记摘要");
    for (const entry of entries.sort((a, b) => a.date.localeCompare(b.date))) {
      const title = entry.title || entry.date;
      lines.push(`### ${entry.date} · ${title}`);
      if (entry.autoSummary) {
        lines.push(`> ${entry.autoSummary}`);
      }
      // First 200 chars of content
      const preview = entry.content.replace(/\n/g, " ").slice(0, 200);
      lines.push(preview + (entry.content.length > 200 ? "..." : ""));
      lines.push("");
    }
  }

  lines.push("---");
  lines.push(`*由 DevPulse 自动生成于 ${new Date().toLocaleString("zh-CN")}*`);

  const markdown = lines.join("\n");

  return Response.json({
    mode,
    range,
    summary: {
      totalCommits,
      totalAdditions,
      totalDeletions,
      netLines,
      totalAiCost: Math.round(totalAiCost * 10000) / 10000,
      diaryCount: entries.length,
      activeDays: activeDaysSet.size,
      projectCommits,
    },
    markdown,
  });
}
