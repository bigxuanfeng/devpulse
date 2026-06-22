/**
 * Tests for ai-usage.ts — DeepSeek balance fetching, snapshot storage, cost calculation.
 */

// ── Mocks ──────────────────────────────────────────────────────────

const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
};

jest.mock("fs", () => mockFs);

// ── Imports ────────────────────────────────────────────────────────

import {
  fetchDeepSeekBalance,
  saveSnapshot,
  getCostStats,
  getCostChangePercent,
  getDailyCost,
} from "@/lib/data/ai-usage";

// ── Helpers ────────────────────────────────────────────────────────

function mockStorageContent(snapshots: { date: string; totalBalance: number; toppedUp: number }[]) {
  mockFs.existsSync.mockReturnValue(true);
  mockFs.readFileSync.mockReturnValue(JSON.stringify({ snapshots }));
}

function mockEmptyStorage() {
  mockFs.existsSync.mockReturnValue(false);
}

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  // Reset process.env
  process.env.DEEPSEEK_API_KEY = "sk-test-key";
  // Default: empty storage
  mockFs.existsSync.mockReturnValue(false);
  // Restore fetch mock
  global.fetch = originalFetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

// ── fetchDeepSeekBalance ───────────────────────────────────────────

describe("fetchDeepSeekBalance", () => {
  it("fetches and parses balance from DeepSeek API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        balance_infos: [
          { total_balance: "100.50", topped_up_balance: "200.00" },
        ],
      }),
    }) as jest.Mock;

    const result = await fetchDeepSeekBalance();

    expect(result.totalBalance).toBe(100.5);
    expect(result.toppedUp).toBe(200);
    // Date should be today
    const today = new Date();
    const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    expect(result.date).toBe(expectedDate);
  });

  it("handles missing balance_infos gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;

    const result = await fetchDeepSeekBalance();
    expect(result.totalBalance).toBe(0);
    expect(result.toppedUp).toBe(0);
  });

  it("throws on API error", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as jest.Mock;

    await expect(fetchDeepSeekBalance()).rejects.toThrow("DeepSeek API error: 401");
  });
});

// ── saveSnapshot ───────────────────────────────────────────────────

describe("saveSnapshot", () => {
  it("saves first snapshot", () => {
    mockEmptyStorage();
    mockFs.existsSync.mockImplementation((p: string) => {
      // Allow mkdirSync path check
      return false;
    });

    saveSnapshot({ date: "2026-06-22", totalBalance: 100, toppedUp: 200 });

    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
    expect(written.snapshots).toHaveLength(1);
    expect(written.snapshots[0].date).toBe("2026-06-22");
  });

  it("deduplicates snapshots for the same date", () => {
    mockStorageContent([
      { date: "2026-06-22", totalBalance: 100, toppedUp: 200 },
    ]);

    saveSnapshot({ date: "2026-06-22", totalBalance: 99, toppedUp: 200 });

    // No new write — same date already exists
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("adds snapshot for new date", () => {
    mockStorageContent([
      { date: "2026-06-21", totalBalance: 110, toppedUp: 200 },
    ]);

    saveSnapshot({ date: "2026-06-22", totalBalance: 100, toppedUp: 200 });

    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
    const written = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
    expect(written.snapshots).toHaveLength(2);
  });

  it("skips write when balance unchanged from last snapshot (avoids HMR refresh loop)", () => {
    mockStorageContent([
      { date: "2026-06-21", totalBalance: 100, toppedUp: 200 },
    ]);

    // Same balance, different date — should NOT write
    saveSnapshot({ date: "2026-06-22", totalBalance: 100, toppedUp: 200 });

    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it("trims storage to last 90 snapshots", () => {
    const snapshots = Array.from({ length: 95 }, (_, i) => ({
      date: `2026-0${String(Math.floor(i / 30) + 1).padStart(2, "0")}-${String((i % 30) + 1).padStart(2, "0")}`,
      totalBalance: 100 - i,
      toppedUp: 200,
    }));

    mockStorageContent(snapshots);

    saveSnapshot({ date: "2026-07-01", totalBalance: 5, toppedUp: 200 });

    const written = JSON.parse(mockFs.writeFileSync.mock.calls[0][1]);
    expect(written.snapshots.length).toBeLessThanOrEqual(90);
    // Should include the new one
    expect(written.snapshots[written.snapshots.length - 1].date).toBe("2026-07-01");
  });
});

// ── getCostStats ───────────────────────────────────────────────────

describe("getCostStats", () => {
  it("returns zeros when no snapshots exist", () => {
    mockEmptyStorage();

    const stats = getCostStats();
    expect(stats.totalCost).toBe(0);
    expect(stats.costThisMonth).toBe(0);
    expect(stats.costLastMonth).toBe(0);
    expect(stats.dailyCosts).toHaveLength(0);
  });

  it("returns zero costs with a single snapshot", () => {
    mockStorageContent([
      { date: "2026-06-22", totalBalance: 100, toppedUp: 200 },
    ]);

    const stats = getCostStats();
    expect(stats.totalCost).toBe(0);
    expect(stats.dailyCosts).toHaveLength(0);
    expect(stats.currentBalance).toBe(100);
  });

  it("calculates daily costs from balance decreases", () => {
    mockStorageContent([
      { date: "2026-06-20", totalBalance: 100, toppedUp: 200 },
      { date: "2026-06-21", totalBalance: 95, toppedUp: 200 },  // spent 5
      { date: "2026-06-22", totalBalance: 90, toppedUp: 200 },  // spent 5
    ]);

    const stats = getCostStats();
    expect(stats.dailyCosts).toHaveLength(2);
    expect(stats.dailyCosts[0].cost).toBe(5);
    expect(stats.dailyCosts[1].cost).toBe(5);
    expect(stats.costThisMonth).toBe(10);
  });

  it("handles balance increase (top-ups) — cost stays zero", () => {
    mockStorageContent([
      { date: "2026-06-20", totalBalance: 100, toppedUp: 200 },
      { date: "2026-06-21", totalBalance: 150, toppedUp: 250 }, // topped up
    ]);

    const stats = getCostStats();
    // Balance went up, so real cost is 0
    expect(stats.dailyCosts[0].cost).toBe(0);
  });

  it("separates this month and last month costs", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    mockStorageContent([
      { date: `${lastMonth}-28`, totalBalance: 200, toppedUp: 300 },
      { date: `${lastMonth}-29`, totalBalance: 190, toppedUp: 300 },
      { date: `${thisMonth}-01`, totalBalance: 185, toppedUp: 300 },
      { date: `${thisMonth}-02`, totalBalance: 180, toppedUp: 300 },
    ]);

    const stats = getCostStats();
    expect(stats.costLastMonth).toBe(10);  // 200 → 190
    expect(stats.costThisMonth).toBe(10);  // 190 → 185 → 180
  });
});

// ── getCostChangePercent ───────────────────────────────────────────

describe("getCostChangePercent", () => {
  it("returns neutral when no last month data", () => {
    mockEmptyStorage();
    const result = getCostChangePercent();
    expect(result.type).toBe("neutral");
    expect(result.change).toBe(0);
  });

  it("calculates percent increase", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    // Last month: 10 cost, This month: 20 cost
    mockStorageContent([
      { date: `${lastMonth}-28`, totalBalance: 200, toppedUp: 300 },
      { date: `${lastMonth}-29`, totalBalance: 190, toppedUp: 300 },
      { date: `${thisMonth}-01`, totalBalance: 185, toppedUp: 300 },
      { date: `${thisMonth}-02`, totalBalance: 170, toppedUp: 300 },
    ]);

    const result = getCostChangePercent();
    expect(result.type).toBe("up");
    expect(result.change).toBe(100); // (20-10)/10 * 100
  });

  it("calculates percent decrease", () => {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

    // Last month: 20 cost, This month: 5 cost
    mockStorageContent([
      { date: `${lastMonth}-28`, totalBalance: 200, toppedUp: 300 },
      { date: `${lastMonth}-29`, totalBalance: 180, toppedUp: 300 },
      { date: `${thisMonth}-01`, totalBalance: 175, toppedUp: 300 },
    ]);

    const result = getCostChangePercent();
    expect(result.type).toBe("down");
  });
});

// ── getDailyCost ───────────────────────────────────────────────────

describe("getDailyCost", () => {
  it("returns cost for a specific date", () => {
    mockStorageContent([
      { date: "2026-06-20", totalBalance: 100, toppedUp: 200 },
      { date: "2026-06-21", totalBalance: 93, toppedUp: 200 },
      { date: "2026-06-22", totalBalance: 88, toppedUp: 200 },
    ]);

    const cost = getDailyCost("2026-06-22");
    expect(cost).toBe(5);
  });

  it("returns 0 for date with no data", () => {
    mockStorageContent([
      { date: "2026-06-20", totalBalance: 100, toppedUp: 200 },
    ]);

    const cost = getDailyCost("2026-06-22");
    expect(cost).toBe(0);
  });
});
