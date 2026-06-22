/**
 * Tests for git-collector.ts — git log parsing, stats aggregation, caching.
 */
import { execSync } from "child_process";

// ── Mocks ──────────────────────────────────────────────────────────

const mockGetProjects = jest.fn();

jest.mock("@/lib/data/projects-config", () => ({
  getProjects: () => mockGetProjects(),
}));

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

// Import after mocks are set up
import {
  collectGitStats,
  collectAllGitStats,
  getGlobalActivity,
  getDailyGitSummary,
  invalidateGitCache,
} from "@/lib/data/git-collector";

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;

// ── Helpers ────────────────────────────────────────────────────────

/** Build a fake `git log --numstat` output string */
function makeGitLogOutput(
  commits: { hash: string; date: string; message: string; adds?: number; dels?: number }[]
): string {
  return commits
    .map((c) => {
      const header = `${c.hash}|${c.date}|${c.message}`;
      const numstat = `${c.adds ?? 0}\t${c.dels ?? 0}\tsrc/file.ts`;
      return `${header}\n${numstat}\n`;
    })
    .join("\n");
}

/** Build a fake `git grep` output string */
function makeTodoOutput(counts: Record<string, number>): string {
  return Object.entries(counts)
    .map(([file, count]) => `${file}:${count}`)
    .join("\n");
}

/** Days ago from now */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace(/\.\d{3}Z$/, "+08:00");
}

// ── Setup / Teardown ───────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  invalidateGitCache();
});

// ── collectGitStats ────────────────────────────────────────────────

describe("collectGitStats", () => {
  it("returns null for non-git repos", () => {
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error("not a git repo");
    });

    const result = collectGitStats("/fake/path", "fake-project");
    expect(result).toBeNull();
  });

  it("collects stats for a valid repo with commits", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(twoDaysAgo.getDate()).padStart(2, "0")}`;

    // First call: git rev-parse (isGitRepo)
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    // Second call: git log
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "abc123", date: `${twoDaysStr}T10:30:00+08:00`, message: "feat: add login", adds: 50, dels: 10 },
        { hash: "def456", date: `${yestStr}T14:00:00+08:00`, message: "fix: login bug", adds: 5, dels: 30 },
        { hash: "ghi789", date: "2025-12-01T09:00:00+08:00", message: "old commit", adds: 100, dels: 0 },
      ])
    );
    // Third call: git grep (countTodos)
    mockedExecSync.mockReturnValueOnce(makeTodoOutput({ "src/app.ts": 2, "src/lib.ts": 1 }));

    mockGetProjects.mockReturnValue([{ name: "test", path: "/fake/path" }]);

    const result = collectGitStats("/fake/path", "test-project");
    expect(result).not.toBeNull();
    expect(result!.projectName).toBe("test-project");
    expect(result!.totalCommits).toBe(3);
    expect(result!.commitsThisMonth).toBe(2);
    expect(result!.activeDaysThisMonth).toBe(2);
    expect(result!.status).toBe("active");
    expect(result!.todoCount).toBe(3);
    expect(result!.additionsThisMonth).toBe(55);
    expect(result!.deletionsThisMonth).toBe(40);
    expect(result!.recentCommits).toHaveLength(3); // all 3 since only 3 total
  });

  it("marks project as stale when last commit is 8-30 days ago", () => {
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "abc", date: daysAgo(14), message: "stale commit", adds: 10, dels: 0 },
      ])
    );
    mockedExecSync.mockReturnValueOnce("");

    const result = collectGitStats("/repo", "stale-project");
    expect(result!.status).toBe("stale");
  });

  it("marks project as dead when last commit > 30 days ago", () => {
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "abc", date: daysAgo(35), message: "dead commit", adds: 10, dels: 0 },
      ])
    );
    mockedExecSync.mockReturnValueOnce("");

    const result = collectGitStats("/repo", "dead-project");
    expect(result!.status).toBe("dead");
  });

  it("marks project as dead when there are no commits", () => {
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce("");
    mockedExecSync.mockReturnValueOnce("");

    const result = collectGitStats("/repo", "empty-project");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("dead");
    expect(result!.totalCommits).toBe(0);
  });
});

// ── collectAllGitStats ─────────────────────────────────────────────

describe("collectAllGitStats", () => {
  it("aggregates stats across multiple projects", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    mockGetProjects.mockReturnValue([
      { name: "proj-a", path: "/a" },
      { name: "proj-b", path: "/b" },
    ]);

    // Project A — valid
    mockedExecSync.mockReturnValueOnce(Buffer.from("")); // isGitRepo
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "a1", date: `${thisMonth}-10T10:00:00+08:00`, message: "A commit", adds: 20, dels: 5 },
      ])
    );
    mockedExecSync.mockReturnValueOnce(makeTodoOutput({ "a.ts": 1 }));

    // Project B — valid
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "b1", date: `${thisMonth}-11T11:00:00+08:00`, message: "B commit", adds: 30, dels: 10 },
      ])
    );
    mockedExecSync.mockReturnValueOnce("");

    const results = collectAllGitStats();
    expect(results).toHaveLength(2);
    expect(results[0].projectName).toBe("proj-a");
    expect(results[1].projectName).toBe("proj-b");
  });

  it("skips non-git repos", () => {
    mockGetProjects.mockReturnValue([
      { name: "valid", path: "/valid" },
      { name: "invalid", path: "/invalid" },
    ]);

    // valid
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "x", date: "2026-06-01T10:00:00+08:00", message: "ok" }]));
    mockedExecSync.mockReturnValueOnce("");

    // invalid
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error("not a repo");
    });

    const results = collectAllGitStats();
    expect(results).toHaveLength(1);
    expect(results[0].projectName).toBe("valid");
  });

  it("caches results within TTL for same project set", () => {
    mockGetProjects.mockReturnValue([{ name: "p", path: "/p" }]);

    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "x", date: "2026-06-01T10:00:00+08:00", message: "ok" }]));
    mockedExecSync.mockReturnValueOnce("");

    // First call — should run git commands
    const first = collectAllGitStats();
    // Second call — should hit cache
    const second = collectAllGitStats();

    // execSync should only have been called 3 times (isGitRepo + git log + countTodos)
    expect(mockedExecSync).toHaveBeenCalledTimes(3);
    expect(second).toEqual(first);
  });

  it("invalidates cache when project set changes", () => {
    // First project set
    mockGetProjects.mockReturnValue([{ name: "p1", path: "/p1" }]);
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "x", date: "2026-06-01T10:00:00+08:00", message: "ok" }]));
    mockedExecSync.mockReturnValueOnce("");

    collectAllGitStats();

    // Change projects
    mockGetProjects.mockReturnValue([{ name: "p2", path: "/p2" }]);
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "y", date: "2026-06-02T10:00:00+08:00", message: "ok2" }]));
    mockedExecSync.mockReturnValueOnce("");

    const result = collectAllGitStats();
    // Should have fresh data from new project
    expect(result).toHaveLength(1);
    expect(result[0].projectName).toBe("p2");
  });
});

// ── getGlobalActivity ──────────────────────────────────────────────

describe("getGlobalActivity", () => {
  it("aggregates daily activity across all projects", () => {
    mockGetProjects.mockReturnValue([
      { name: "p1", path: "/p1" },
      { name: "p2", path: "/p2" },
    ]);

    // p1 isGitRepo
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    // p1 git log — 2 commits on same day
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "a", date: "2026-06-22T09:00:00+08:00", message: "morning" },
        { hash: "b", date: "2026-06-22T14:00:00+08:00", message: "afternoon" },
      ])
    );

    // p2 isGitRepo
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    // p2 git log — 1 commit on different day
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "c", date: "2026-06-21T10:00:00+08:00", message: "yesterday" },
      ])
    );

    const result = getGlobalActivity();
    expect(result.totalCommits).toBe(3);
    expect(result.activeDays).toBe(2);
    expect(result.dailyActivity).toHaveLength(2);
    // Day with 2 commits
    const day22 = result.dailyActivity.find((d) => d.date === "2026-06-22")!;
    expect(day22.count).toBe(2);
    expect(day22.hourDistribution[9]).toBe(1);
    expect(day22.hourDistribution[14]).toBe(1);
  });

  it("caches results", () => {
    mockGetProjects.mockReturnValue([{ name: "p", path: "/p" }]);

    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "x", date: "2026-06-22T10:00:00+08:00", message: "ok" }]));

    getGlobalActivity();
    getGlobalActivity();

    // Only 2 calls (isGitRepo + git log), not 4
    expect(mockedExecSync).toHaveBeenCalledTimes(2);
  });
});

// ── getDailyGitSummary ─────────────────────────────────────────────

describe("getDailyGitSummary", () => {
  it("filters commits by date", () => {
    mockGetProjects.mockReturnValue([{ name: "p", path: "/p" }]);

    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([
        { hash: "a", date: "2026-06-22T09:00:00+08:00", message: "today", adds: 10, dels: 2 },
        { hash: "b", date: "2026-06-21T10:00:00+08:00", message: "yesterday", adds: 5, dels: 1 },
      ])
    );

    const result = getDailyGitSummary("2026-06-22");
    expect(result.totalCommits).toBe(1);
    expect(result.totalAdditions).toBe(10);
    expect(result.totalDeletions).toBe(2);
    expect(result.projects[0].name).toBe("p");
  });

  it("returns zeros when no commits match the date", () => {
    mockGetProjects.mockReturnValue([{ name: "p", path: "/p" }]);

    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(
      makeGitLogOutput([{ hash: "a", date: "2026-06-20T09:00:00+08:00", message: "other day" }])
    );

    const result = getDailyGitSummary("2026-06-22");
    expect(result.totalCommits).toBe(0);
    expect(result.totalAdditions).toBe(0);
    expect(result.projects).toHaveLength(0);
  });
});

// ── invalidateGitCache ─────────────────────────────────────────────

describe("invalidateGitCache", () => {
  it("forces re-fetch after invalidation", () => {
    mockGetProjects.mockReturnValue([{ name: "p", path: "/p" }]);

    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "x", date: "2026-06-22T10:00:00+08:00", message: "ok" }]));
    mockedExecSync.mockReturnValueOnce("");

    collectAllGitStats();
    expect(mockedExecSync).toHaveBeenCalledTimes(3);

    invalidateGitCache();

    // New mocks for re-fetch
    mockedExecSync.mockReturnValueOnce(Buffer.from(""));
    mockedExecSync.mockReturnValueOnce(makeGitLogOutput([{ hash: "y", date: "2026-06-22T11:00:00+08:00", message: "new" }]));
    mockedExecSync.mockReturnValueOnce("");

    collectAllGitStats();
    expect(mockedExecSync).toHaveBeenCalledTimes(6); // 3 more calls
  });
});
