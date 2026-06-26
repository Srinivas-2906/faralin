import type { ReactNode } from 'react';

type AlertVariant = 'error' | 'success' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<AlertVariant, string> = {
  error: 'alert-error',
  success: 'alert-success',
  info: 'alert-info',
};

export function Alert({ variant = 'error', children, className = '' }: AlertProps) {
  return (
    <div className={`alert ${variantClass[variant]} ${className}`.trim()} role="alert">
      {children}
    </div>
  );
}
