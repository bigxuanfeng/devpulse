"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  dailyCosts: { date: string; cost: number }[];
}

export function CostTrend({ dailyCosts }: Props) {
  if (dailyCosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted text-sm">
        暂无成本数据（需要连续运行 2 天以上）
      </div>
    );
  }

  const data = dailyCosts.map((d) => ({
    date: d.date.slice(5), // MM-DD
    cost: d.cost,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: "#5c5850", fontSize: 10 }}
          axisLine={{ stroke: "#1e1e2a" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "#5c5850", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `¥${v}`}
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
          formatter={(value) => [`¥ ${Number(value).toFixed(2)}`, "日成本"]}
        />
        <Line
          type="monotone"
          dataKey="cost"
          stroke="#e8954c"
          strokeWidth={2}
          dot={{ fill: "#e8954c", strokeWidth: 0, r: 3 }}
          activeDot={{ fill: "#f0a868", strokeWidth: 0, r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
