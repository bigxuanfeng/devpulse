import { execSync } from "child_process";
import type { CommitInfo, GitStats, DailyActivity } from "./types";
import { getProjects } from "./projects-config";

function isGitRepo(path: string): boolean {
  try {
    execSync("git rev-parse --git-dir", { cwd: path, stdio: "ignore" });
    return true;
  } catch (err) {
    console.error(`[git-collector] Failed to verify git repo at ${path}:`, err);
    return false;
  }
}

function getCommitLog(path: string, since?: string): CommitInfo[] {
  try {
    const range = since ? `--since="${since}"` : "";
    const format = "%H|%aI|%s";
    const cmd = `git log ${range} --format="${format}" --numstat`;
    const output = execSync(cmd, { cwd: path, encoding: "utf-8" });

    const commits: CommitInfo[] = [];
    let current: Partial<CommitInfo> | null = null;

    for (const line of output.split("\n")) {
      if (!line.trim()) {
        if (current?.hash) commits.push(current as CommitInfo);
        current = null;
        continue;
      }

      if (line.includes("|")) {
        // Commit header: hash|date|message
        const [hash, date, ...msgParts] = line.split("|");
        // Guard against split producing too many parts (message may contain |)
        const message = msgParts.join("|").trim();
        if (hash && date) {
          current = { hash: hash.trim(), date: date.trim(), message, additions: 0, deletions: 0 };
        }
      } else if (current) {
        // Numstat line: additions\ttabs\tfilename
        const parts = line.split("\t");
        const added = parseInt(parts[0], 10);
        const deleted = parseInt(parts[1], 10);
        if (!isNaN(added)) current.additions = (current.additions ?? 0) + added;
        if (!isNaN(deleted)) current.deletions = (current.deletions ?? 0) + deleted;
      }
    }

    // Don't forget the last one
    if (current?.hash) commits.push(current as CommitInfo);

    return commits.reverse(); // oldest first
  } catch (err) {
    console.error(`[git-collector] Failed to get commit log for ${path}:`, err);
    return [];
  }
}

function countTodos(path: string): number {
  try {
    // Count TODO/FIXME across code files
    const cmd = `git grep -c -E "TODO|FIXME|HACK|XXX" -- "*.ts" "*.tsx" "*.py" "*.cs" "*.js" 2>nul || echo ""`;
    const output = execSync(cmd, { cwd: path, encoding: "utf-8" });
    let total = 0;
    for (const line of output.split("\n")) {
      const match = line.match(/:(\d+)$/);
      if (match) total += parseInt(match[1], 10);
    }
    return total;
  } catch (err) {
    console.error(`[git-collector] Failed to count TODOs for ${path}:`, err);
    return 0;
  }
}

function determineStatus(lastCommitDate: string | null): GitStats["status"] {
  if (!lastCommitDate) return "dead";
  const daysSince = (Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return "active";
  if (daysSince <= 30) return "stale";
  return "dead";
}

function getMonthlyActivity(commits: CommitInfo[], year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthCommits = commits.filter((c) => c.date.startsWith(monthStr));
  const uniqueDays = new Set(monthCommits.map((c) => c.date.slice(0, 10)));
  const additions = monthCommits.reduce((sum, c) => sum + c.additions, 0);
  const deletions = monthCommits.reduce((sum, c) => sum + c.deletions, 0);

  return {
    count: monthCommits.length,
    activeDays: uniqueDays.size,
    additions,
    deletions,
  };
}

function getDailyActivity(commits: CommitInfo[]): DailyActivity[] {
  const map = new Map<string, { count: number; hours: number[] }>();

  for (const c of commits) {
    const day = c.date.slice(0, 10);
    const hour = new Date(c.date).getHours();
    if (!map.has(day)) {
      map.set(day, { count: 0, hours: Array(24).fill(0) });
    }
    const entry = map.get(day)!;
    entry.count++;
    entry.hours[hour]++;
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    hourDistribution: data.hours,
  }));
}

// ── In-memory cache for git stats (avoids re-running git log on every dashboard refresh) ──

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  projectKeys: string; // sorted project paths joined — detects config changes
}

let statsCache: CacheEntry<GitStats[]> | null = null;
let activityCache: CacheEntry<{
  totalCommits: number;
  activeDays: number;
  dailyActivity: DailyActivity[];
}> | null = null;

function getProjectKey(): string {
  return getProjects()
    .map((p) => p.path)
    .sort()
    .join("|");
}

function isCacheValid<T>(cache: CacheEntry<T> | null, projectKey: string): boolean {
  if (!cache) return false;
  if (Date.now() - cache.timestamp > CACHE_TTL) return false;
  if (cache.projectKeys !== projectKey) return false;
  return true;
}

export function collectGitStats(projectPath: string, projectName: string): GitStats | null {
  if (!isGitRepo(projectPath)) return null;

  const allCommits = getCommitLog(projectPath);
  const now = new Date();

  const monthly = getMonthlyActivity(allCommits, now.getFullYear(), now.getMonth() + 1);
  const lastCommit = allCommits.length > 0 ? allCommits[allCommits.length - 1] : null;

  return {
    projectName,
    projectPath,
    totalCommits: allCommits.length,
    commitsThisMonth: monthly.count,
    activeDaysThisMonth: monthly.activeDays,
    lastCommitDate: lastCommit?.date ?? null,
    status: determineStatus(lastCommit?.date ?? null),
    todoCount: countTodos(projectPath),
    recentCommits: allCommits.slice(-5).reverse(),
    additionsThisMonth: monthly.additions,
    deletionsThisMonth: monthly.deletions,
  };
}

export function collectAllGitStats(): GitStats[] {
  const projectKey = getProjectKey();

  if (isCacheValid(statsCache, projectKey)) {
    return statsCache!.data;
  }

  const projects = getProjects();
  const data = projects.map((p) => collectGitStats(p.path, p.name)).filter(
    (s): s is GitStats => s !== null
  );

  statsCache = { data, timestamp: Date.now(), projectKeys: projectKey };
  return data;
}

export function getGlobalActivity(): {
  totalCommits: number;
  activeDays: number;
  dailyActivity: DailyActivity[];
} {
  const projectKey = getProjectKey();

  if (isCacheValid(activityCache, projectKey)) {
    return activityCache!.data;
  }

  const projects = getProjects();
  const allCommits: CommitInfo[] = [];
  for (const p of projects) {
    if (isGitRepo(p.path)) {
      allCommits.push(...getCommitLog(p.path));
    }
  }

  const dailyActivity = getDailyActivity(allCommits);
  const uniqueDays = new Set(dailyActivity.map((d) => d.date));

  const data = {
    totalCommits: allCommits.length,
    activeDays: uniqueDays.size,
    dailyActivity,
  };

  activityCache = { data, timestamp: Date.now(), projectKeys: projectKey };
  return data;
}

/** Invalidate all caches — call after project config changes */
export function invalidateGitCache(): void {
  statsCache = null;
  activityCache = null;
}

/**
 * Get a summary of git activity for a specific date across all projects.
 * Returns commit count, additions, deletions, and per-project breakdown.
 */
export function getDailyGitSummary(date: string): {
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  projects: { name: string; commits: number; additions: number; deletions: number }[];
} {
  const projects = getProjects();
  const result: {
    totalCommits: number;
    totalAdditions: number;
    totalDeletions: number;
    projects: { name: string; commits: number; additions: number; deletions: number }[];
  } = {
    totalCommits: 0,
    totalAdditions: 0,
    totalDeletions: 0,
    projects: [],
  };

  for (const p of projects) {
    if (!isGitRepo(p.path)) continue;
    const commits = getCommitLog(p.path, date).filter((c) =>
      c.date.slice(0, 10) === date
    );
    if (commits.length === 0) continue;

    const additions = commits.reduce((s, c) => s + (c.additions || 0), 0);
    const deletions = commits.reduce((s, c) => s + (c.deletions || 0), 0);

    result.totalCommits += commits.length;
    result.totalAdditions += additions;
    result.totalDeletions += deletions;
    result.projects.push({
      name: p.name,
      commits: commits.length,
      additions,
      deletions,
    });
  }

  return result;
}
