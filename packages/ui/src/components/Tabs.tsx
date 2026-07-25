'use client';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, ariaLabel = 'Sections', className = '' }: TabsProps) {
  return (
    <div className={`ui-tabs ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ui-tab${active ? ' ui-tab-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ui-tab-count">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
