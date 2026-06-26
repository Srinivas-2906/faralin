import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Chip({ selected = false, className = '', children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' selected' : ''} ${className}`.trim()}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}
