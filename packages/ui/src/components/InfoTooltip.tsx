'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export interface InfoTooltipProps {
  label: string;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function InfoTooltip({ label, children, id, className = '' }: InfoTooltipProps) {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [close, open]);

  return (
    <span
      ref={rootRef}
      className={`info-tooltip${open ? ' info-tooltip--open' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="info-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span
        id={panelId}
        role="tooltip"
        className="info-tooltip__panel"
        hidden={!open}
      >
        {children}
      </span>
    </span>
  );
}
