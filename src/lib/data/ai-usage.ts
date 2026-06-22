import fs from "fs";
import path from "path";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const STORAGE_FILE = path.join(process.cwd(), "data", "ai-balance.json");

interface BalanceSnapshot {
  date: string; // YYYY-MM-DD
  totalBalance: number;
  toppedUp: number;
}

interface StoredData {
  snapshots: BalanceSnapshot[];
}

function readStorage(): StoredData {
  try {
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(STORAGE_FILE)) return { snapshots: [] };
    return JSON.parse(fs.readFileSync(STORAGE_FILE, "utf-8"));
  } catch (err) {
    console.error("[ai-usage] Failed to read balance storage:", err);
    return { snapshots: [] };
  }
}

function writeStorage(data: StoredData) {
  const dir = path.dirname(STORAGE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
}

export async function fetchDeepSeekBalance(): Promise<BalanceSnapshot> {
  const res = await fetch("https://api.deepseek.com/user/balance", {
    headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);

  const data = await res.json();
  const info = data.balance_infos?.[0] ?? {};

  return {
    date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })(),
    totalBalance: parseFloat(info.total_balance ?? "0"),
    toppedUp: parseFloat(info.topped_up_balance ?? "0"),
  };
}

export function saveSnapshot(snapshot: BalanceSnapshot) {
  const storage = readStorage();

  // Skip if today already has a snapshot
  const today = storage.snapshots.filter((s) => s.date === snapshot.date);
  if (today.length > 0) return;

  // Skip if balance hasn't changed since last snapshot (avoids unnecessary writes
  // that trigger Turbopack HMR → infinite dashboard refresh loop)
  const last = storage.snapshots[storage.snapshots.length - 1];
  if (last && last.totalBalance === snapshot.totalBalance && last.toppedUp === snapshot.toppedUp) {
    return;
  }

  storage.snapshots.push(snapshot);
  // Keep last 90 days
  if (storage.snapshots.length > 90) {
    storage.snapshots = storage.snapshots.slice(-90);
  }
  writeStorage(storage);
}

export function getCostStats() {
  const storage = readStorage();
  const snapshots = storage.snapshots;
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, "0")}`;

  if (snapshots.length < 2) {
    return {
      totalCost: 0,
      costThisMonth: 0,
      costLastMonth: 0,
      currentBalance: snapshots[0]?.totalBalance ?? 0,
      dailyCosts: [] as { date: string; cost: number }[],
    };
  }

  // Cost = money spent (balance decrease). First snapshot of day vs last of day.
  const dailyMap = new Map<string, { earliest: number; latest: number }>();

  for (const s of snapshots) {
    if (!dailyMap.has(s.date)) {
      dailyMap.set(s.date, { earliest: s.totalBalance, latest: s.totalBalance });
    }
    const day = dailyMap.get(s.date)!;
    day.latest = s.totalBalance;
  }

  const dailyCosts: { date: string; cost: number }[] = [];
  let costThisMonth = 0;
  let costLastMonth = 0;

  const dates = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (let i = 1; i < dates.length; i++) {
    const prevDay = dates[i - 1];
    const currDay = dates[i];
    const cost = prevDay[1].latest - currDay[1].earliest;
    // Only count positive costs (balance went down)
    const realCost = cost > 0 ? Math.round(cost * 100) / 100 : 0;

    dailyCosts.push({ date: currDay[0], cost: realCost });

    if (currDay[0].startsWith(thisMonth)) costThisMonth += realCost;
    if (currDay[0].startsWith(lastMonth)) costLastMonth += realCost;
  }

  return {
    totalCost: Math.round((costThisMonth + costLastMonth) * 100) / 100,
    costThisMonth: Math.round(costThisMonth * 100) / 100,
    costLastMonth: Math.round(costLastMonth * 100) / 100,
    currentBalance: snapshots[snapshots.length - 1]?.totalBalance ?? 0,
    dailyCosts,
  };
}

export function getCostChangePercent(): { change: number; type: "up" | "down" | "neutral" } {
  const stats = getCostStats();
  if (stats.costLastMonth === 0) return { change: 0, type: "neutral" };
  const change =
    Math.round(
      ((stats.costThisMonth - stats.costLastMonth) / stats.costLastMonth) * 100
    );
  return {
    change,
    type: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
}

/** Get the AI cost for a specific date */
export function getDailyCost(date: string): number {
  const dailyCosts = getCostStats().dailyCosts;
  const entry = dailyCosts.find((d) => d.date === date);
  return entry?.cost ?? 0;
}
