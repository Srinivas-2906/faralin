import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, message, action, compact = false }: EmptyStateProps) {
  return (
    <div className={`empty-state${compact ? '' : ''}`} style={compact ? { padding: '1rem' } : undefined}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <p className="empty-state-title">{title}</p>}
      <p className="empty-state-desc">{message}</p>
      {action}
    </div>
  );
}
