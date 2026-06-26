import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  copper?: boolean;
  footer?: ReactNode;
}

export function StatCard({ label, value, copper = false, footer }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${copper ? ' copper' : ''}`}>{value}</div>
      {footer}
    </div>
  );
}
