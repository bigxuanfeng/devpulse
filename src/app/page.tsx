"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { CostTrend } from "@/components/dashboard/CostTrend";
import { HourDistribution } from "@/components/dashboard/HourDistribution";
import { KpiSkeleton, ChartSkeleton, HealthCardSkeleton } from "@/components/ui/Skeleton";
import { Coins, GitCommit, Activity, Heart } from "lucide-react";
import type { DashboardData } from "@/lib/data/types";

interface Summary {
  totalCommitsThisMonth: number;
  activeProjects: number;
  costThisMonth: number;
  activeDays: number;
  costChange: { change: number; type: "up" | "down" | "neutral" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed");
        const json = await res.json();
        setData({
          gitStats: json.gitStats,
          aiUsage: json.aiUsage,
          global: json.global,
        });
        setSummary(json.summary);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        <h1 className="text-xl font-semibold text-text-primary mb-6">面板</h1>

        {/* KPI Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>

        {/* Health Card Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HealthCardSkeleton />
          <HealthCardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
        <h1 className="text-xl font-semibold text-text-primary mb-6">面板</h1>
        <div className="text-text-muted text-sm">数据加载失败，请确保在本地运行</div>
      </div>
    );
  }

  const s = summary!;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 w-full">
      <h1 className="text-xl font-semibold text-text-primary mb-6">面板</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="AI 成本（本月）"
          value={`¥ ${s.costThisMonth.toFixed(2)}`}
          change={
            s.costChange.change === 0
              ? "暂无对比数据"
              : `${s.costChange.type === "up" ? "↑" : "↓"} ${Math.abs(s.costChange.change)}% 较上月`
          }
          changeType={s.costChange.type}
          icon={Coins}
        />
        <KpiCard
          title="本月提交"
          value={String(s.totalCommitsThisMonth)}
          change={`${s.activeProjects} 个活跃项目`}
          changeType="neutral"
          icon={GitCommit}
        />
        <KpiCard
          title="活跃天数"
          value={String(s.activeDays)}
          change="历史累计"
          changeType="neutral"
          icon={Activity}
        />
        <KpiCard
          title="项目健康"
          value={`${s.activeProjects}/${data.gitStats.length}`}
          change="活跃 / 总计"
          changeType={s.activeProjects === data.gitStats.length ? "up" : "neutral"}
          icon={Heart}
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <ChartCard title="代码活动热力图">
          <ActivityHeatmap dailyActivity={data.global?.dailyActivity ?? []} />
        </ChartCard>
        <ChartCard title="AI 成本趋势">
          <CostTrend dailyCosts={data.aiUsage?.dailyCosts ?? []} />
        </ChartCard>
        <ChartCard title="编码时间分布">
          <HourDistribution dailyActivity={data.global?.dailyActivity ?? []} />
        </ChartCard>
      </div>

      {/* Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.gitStats.map((project) => (
          <HealthCard
            key={project.projectName}
            name={project.projectName}
            lastCommit={
              project.lastCommitDate
                ? new Date(project.lastCommitDate).toLocaleDateString("zh-CN")
                : "无提交"
            }
            todoCount={project.todoCount}
            status={project.status}
            onClick={() => router.push(`/projects/${project.projectName}`)}
          />
        ))}
        {data.gitStats.length < 2 && (
          <div className="bg-bg-surface rounded-md p-6 shadow-card border border-border-default flex items-center justify-center text-text-muted text-sm">
            添加更多项目仓库 →
          </div>
        )}
      </div>
    </div>
  );
}
