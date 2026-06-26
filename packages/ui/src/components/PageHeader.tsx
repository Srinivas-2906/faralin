import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
      <div className="cluster" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-header-title">{title}</h1>
          {description && <p className="page-header-desc">{description}</p>}
        </div>
        {actions}
      </div>
    </header>
  );
}
