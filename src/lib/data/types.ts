// Git stats
export interface CommitInfo {
  hash: string;
  date: string; // ISO 8601
  message: string;
  additions: number;
  deletions: number;
}

export interface GitStats {
  projectName: string;
  projectPath: string;
  totalCommits: number;
  commitsThisMonth: number;
  activeDaysThisMonth: number;
  lastCommitDate: string | null;
  status: "active" | "stale" | "dead";
  todoCount: number;
  recentCommits: CommitInfo[];
  additionsThisMonth: number;
  deletionsThisMonth: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
  hourDistribution: number[]; // 24 slots
}

// AI usage
export interface AiUsage {
  totalCost: number;
  costThisMonth: number;
  costLastMonth: number;
  dailyCosts: { date: string; cost: number }[];
}

// Dashboard aggregate
export interface DashboardData {
  gitStats: GitStats[];
  aiUsage: AiUsage | null;
  global: {
    totalCommits: number;
    activeDays: number;
    dailyActivity: DailyActivity[];
  };
}
