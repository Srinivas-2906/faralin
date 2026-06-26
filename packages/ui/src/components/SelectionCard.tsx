import type { InputHTMLAttributes, ReactNode } from 'react';

interface SelectionCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  selected?: boolean;
  children: ReactNode;
}

export function SelectionCard({
  selected = false,
  className = '',
  children,
  id,
  ...inputProps
}: SelectionCardProps) {
  return (
    <label
      htmlFor={id}
      className={`selection-card${selected ? ' selected' : ''} ${className}`.trim()}
    >
      <input
        type="checkbox"
        id={id}
        checked={selected}
        style={{ marginTop: '0.25rem', flexShrink: 0 }}
        {...inputProps}
      />
      <div style={{ flex: 1 }}>{children}</div>
    </label>
  );
}
