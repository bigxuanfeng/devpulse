import { NextResponse } from "next/server";
import { collectAllGitStats, getGlobalActivity } from "@/lib/data/git-collector";

export const dynamic = "force-dynamic";

export async function GET() {
  const gitStats = collectAllGitStats();
  const global = getGlobalActivity();

  return NextResponse.json({ gitStats, global });
}
