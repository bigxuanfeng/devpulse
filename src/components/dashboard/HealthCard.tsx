interface HealthCardProps {
  name: string;
  lastCommit: string;
  todoCount: number;
  status: "active" | "stale" | "dead";
}

const STATUS_MAP: Record<HealthCardProps["status"], { label: string; color: string }> = {
  active: { label: "活跃", color: "text-success" },
  stale: { label: "不活跃", color: "text-warning" },
  dead: { label: "已停止", color: "text-error" },
};

export function HealthCard({ name, lastCommit, todoCount, status }: HealthCardProps) {
  const s = STATUS_MAP[status];

  return (
    <div className="bg-bg-surface rounded-md p-4 shadow-card border border-border-default">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-text-primary">{name}</h3>
        <span className={`text-xs ${s.color}`}>{s.label}</span>
      </div>
      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-text-muted">最近提交：</span>
          <span className="text-text-secondary ml-1">{lastCommit}</span>
        </div>
        <div>
          <span className="text-text-muted">待办：</span>
          <span className="text-text-secondary ml-1">{todoCount}</span>
        </div>
      </div>
    </div>
  );
}
