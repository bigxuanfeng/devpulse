interface HourDistributionProps {
  dailyActivity: { date: string; count: number; hourDistribution: number[] }[];
}

export function HourDistribution({ dailyActivity }: HourDistributionProps) {
  // Aggregate hour distribution across all days
  const aggregated = new Array(24).fill(0);
  let maxVal = 0;
  for (const day of dailyActivity) {
    for (let h = 0; h < 24; h++) {
      aggregated[h] += day.hourDistribution[h] || 0;
      if (aggregated[h] > maxVal) maxVal = aggregated[h];
    }
  }

  // Find peak hour
  let peakHour = 0;
  for (let h = 0; h < 24; h++) {
    if (aggregated[h] > aggregated[peakHour]) peakHour = h;
  }

  // Determine activity level for each hour
  const getBarColor = (val: number) => {
    if (val === 0) return "bg-border-default";
    const ratio = val / (maxVal || 1);
    if (ratio > 0.6) return "bg-accent";
    if (ratio > 0.3) return "bg-accent/70";
    return "bg-accent/40";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-muted">
          峰值时段：{peakHour}:00 ~ {peakHour + 1}:00
        </span>
        <span className="text-xs text-text-muted">
          总提交数：{aggregated.reduce((a, b) => a + b, 0)}
        </span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-0.5 h-[120px]">
        {aggregated.map((val, h) => {
          const heightPct = maxVal > 0 ? Math.max((val / maxVal) * 100, 2) : 2;
          return (
            <div
              key={h}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${h}:00-${h + 1}:00 | ${val} commits`}
            >
              <span className="text-[9px] text-text-muted leading-none">
                {val > 0 ? val : ""}
              </span>
              <div
                className={`w-full rounded-t-sm ${getBarColor(val)} transition-all duration-300`}
                style={{ height: `${heightPct}%` }}
              />
              {/* Hour label - show every 3 hours */}
              {(h % 3 === 0) && (
                <span className="text-[9px] text-text-muted leading-none">
                  {h}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
        <span>🌙 深夜 0-6</span>
        <span>☀️ 上午 7-12</span>
        <span>🌆 下午 13-18</span>
        <span>🌙 晚上 19-23</span>
      </div>
    </div>
  );
}
