import { NextRequest, NextResponse } from "next/server";
import { fetchDeepSeekBalance, saveSnapshot, getCostStats } from "@/lib/data/ai-usage";

export const dynamic = "force-dynamic";

// GET /api/ai-balance - 获取当前余额和成本统计
export async function GET(req: NextRequest) {
  try {
    const stats = getCostStats();

    return NextResponse.json({
      success: true,
      data: {
        currentBalance: stats.currentBalance,
        totalCost: stats.totalCost,
        costThisMonth: stats.costThisMonth,
        costLastMonth: stats.costLastMonth,
        dailyCosts: stats.dailyCosts.slice(-30), // 最近 30 天
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/ai-balance - 获取并保存最新余额快照
export async function POST(req: NextRequest) {
  try {
    const snapshot = await fetchDeepSeekBalance();
    saveSnapshot(snapshot);

    const stats = getCostStats();

    return NextResponse.json({
      success: true,
      data: {
        snapshot,
        stats: {
          currentBalance: stats.currentBalance,
          totalCost: stats.totalCost,
          costThisMonth: stats.costThisMonth,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
