import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  icon: LucideIcon;
}

const CHANGE_COLORS: Record<KpiCardProps["changeType"], string> = {
  up: "text-success",
  down: "text-error",
  neutral: "text-text-muted",
};

export function KpiCard({ title, value, change, changeType, icon: Icon }: KpiCardProps) {
  return (
    <div className="bg-bg-surface rounded-md p-4 shadow-card border border-border-default transition-all duration-250 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">{title}</span>
        <Icon size={20} className="text-text-secondary" />
      </div>
      <div className="text-2xl font-semibold text-text-primary font-[family-name:var(--font-editor)] tabular-nums mb-1">
        {value}
      </div>
      <div className={`text-xs ${CHANGE_COLORS[changeType]}`}>{change}</div>
    </div>
  );
}
