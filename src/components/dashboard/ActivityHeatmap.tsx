"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import type { DailyActivity } from "@/lib/data/types";

interface Props {
  dailyActivity: DailyActivity[];
}

export function ActivityHeatmap({ dailyActivity }: Props) {
  if (dailyActivity.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        暂无活动数据
      </div>
    );
  }

  // Show last 30 days
  const data = dailyActivity.slice(-30).map((d) => ({
    date: d.date.slice(5), // MM-DD
    commits: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#5c5850", fontSize: 10 }}
          axisLine={{ stroke: "#1e1e2a" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#5c5850", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a24",
            border: "1px solid #2a2a38",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#ede4d8",
          }}
          labelStyle={{ color: "#a09a90" }}
        />
        <Bar dataKey="commits" fill="#e8954c" radius={[3, 3, 0, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}
