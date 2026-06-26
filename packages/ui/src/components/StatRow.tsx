interface StatRowItem {
  label: string;
  value: string | number;
  copper?: boolean;
}

interface StatRowProps {
  items: StatRowItem[];
}

export function StatRow({ items }: StatRowProps) {
  return (
    <div className="stat-row">
      {items.map((item) => (
        <div key={item.label} className="stat-row-item">
          <div className={`stat-row-value${item.copper ? ' copper' : ''}`}>{item.value}</div>
          <div className="stat-row-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
