import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'copper' | 'crimson';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  block?: boolean;
  lg?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  copper: 'btn-copper',
  crimson: 'btn-crimson',
};

export function Button({
  variant = 'primary',
  loading = false,
  block = false,
  lg = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    variantClass[variant],
    block ? 'btn-block' : '',
    lg ? 'btn-lg' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
