import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'verified' | 'copper' | 'crimson';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: '',
  verified: 'badge-verified',
  copper: 'badge-copper',
  crimson: 'badge-crimson',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]} ${className}`.trim()}>{children}</span>
  );
}
