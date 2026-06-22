interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-bg-surface rounded-md shadow-card border border-border-default overflow-hidden">
      <div className="px-4 py-3 border-b border-border-default">
        <h3 className="text-lg font-medium text-text-primary">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
