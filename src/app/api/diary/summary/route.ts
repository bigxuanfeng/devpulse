import { NextRequest, NextResponse } from "next/server";
import { getDailyGitSummary } from "@/lib/data/git-collector";
import { getDailyCost } from "@/lib/data/ai-usage";

export const dynamic = "force-dynamic";

// GET /api/diary/summary?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format, expected YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const gitSummary = getDailyGitSummary(date);
  const aiCost = getDailyCost(date);

  // Build summary string like "5 commits · ¥1.2 · +320行"
  const parts: string[] = [];

  if (gitSummary.totalCommits > 0) {
    parts.push(`${gitSummary.totalCommits} commits`);
  }

  if (aiCost > 0) {
    parts.push(`¥${aiCost.toFixed(2)}`);
  }

  const netLines = gitSummary.totalAdditions - gitSummary.totalDeletions;
  if (gitSummary.totalAdditions > 0 || gitSummary.totalDeletions > 0) {
    const sign = netLines >= 0 ? "+" : "";
    parts.push(`${sign}${netLines}行`);
  }

  // Per-project breakdown
  const projectDetails = gitSummary.projects.map((p) => {
    const net = p.additions - p.deletions;
    const sign = net >= 0 ? "+" : "";
    return {
      name: p.name,
      commits: p.commits,
      additions: p.additions,
      deletions: p.deletions,
      netLines: net,
      label: `${p.commits} commits · ${sign}${net}行`,
    };
  });

  return NextResponse.json({
    summary: parts.join(" · ") || "无活动",
    totalCommits: gitSummary.totalCommits,
    aiCost,
    additions: gitSummary.totalAdditions,
    deletions: gitSummary.totalDeletions,
    netLines,
    projects: projectDetails,
  });
}
