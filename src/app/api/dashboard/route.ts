import { NextResponse } from "next/server";
import { collectAllGitStats, getGlobalActivity } from "@/lib/data/git-collector";
import { fetchDeepSeekBalance, saveSnapshot, getCostStats } from "@/lib/data/ai-usage";

export const dynamic = "force-dynamic";

export async function GET() {
  // Git stats
  const gitStats = collectAllGitStats();
  const global = getGlobalActivity();

  // AI usage — fetch current balance and save snapshot
  let aiUsage = null;
  try {
    const balance = await fetchDeepSeekBalance();
    saveSnapshot(balance);
    aiUsage = getCostStats();
  } catch (err) {
    // AI API unavailable — return what we have stored
    console.error("[Dashboard API] Failed to fetch DeepSeek balance:", err);
    aiUsage = getCostStats();
  }

  // Aggregate for display
  const totalCommitsThisMonth = gitStats.reduce((s, p) => s + p.commitsThisMonth, 0);
  const activeProjects = gitStats.filter((p) => p.status === "active").length;

  // Cost change percentage
  let costChange: { change: number; type: "up" | "down" | "neutral" } = {
    change: 0,
    type: "neutral",
  };
  if (aiUsage && aiUsage.costLastMonth > 0) {
    const change = Math.round(
      ((aiUsage.costThisMonth - aiUsage.costLastMonth) / aiUsage.costLastMonth) * 100
    );
    costChange = {
      change,
      type: change > 0 ? "up" : change < 0 ? "down" : "neutral",
    };
  }

  return NextResponse.json({
    gitStats,
    global,
    aiUsage,
    summary: {
      totalCommitsThisMonth,
      activeProjects,
      costThisMonth: aiUsage?.costThisMonth ?? 0,
      activeDays: global.activeDays,
      costChange,
    },
  });
}
