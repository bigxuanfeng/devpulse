import { NextResponse } from "next/server";
import { collectAllGitStats, getGlobalActivity } from "@/lib/data/git-collector";
import { fetchDeepSeekBalance, getCostStats } from "@/lib/data/ai-usage";

export const dynamic = "force-dynamic";

export async function GET() {
  // Git stats
  const gitStats = collectAllGitStats();
  const global = getGlobalActivity();

  // AI usage — 只读取已有数据，不写入文件（避免触发 Turbopack 重新编译 → 无限刷新）
  let aiUsage = null;
  try {
    // 尝试获取最新余额（仅内存中使用，不保存到文件）
    const balance = await fetchDeepSeekBalance();
    // 注意：不在 GET 请求中调用 saveSnapshot，避免写文件触发 HMR 循环
    // 快照保存由 /api/ai-balance POST 端点专门处理（设置页手动触发）
    aiUsage = {
      ...getCostStats(),
      currentBalance: balance.totalBalance,
    };
  } catch (err) {
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
