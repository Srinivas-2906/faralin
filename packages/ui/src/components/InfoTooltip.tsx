'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

export interface InfoTooltipProps {
  label: string;
  children: ReactNode;
  id?: string;
  className?: string;
  placement?: 'auto' | 'start' | 'end';
}

const VIEWPORT_MARGIN = 8;
const PANEL_MAX_WIDTH = 256;
const CLOSE_DELAY_MS = 120;

export function InfoTooltip({
  label,
  children,
  id,
  className = '',
  placement = 'auto',
}: InfoTooltipProps) {
  const generatedId = useId();
  const panelId = id ?? generatedId;
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const closeDelayRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  const clearCloseDelay = useCallback(() => {
    if (closeDelayRef.current !== null) {
      window.clearTimeout(closeDelayRef.current);
      closeDelayRef.current = null;
    }
  }, []);

  const openTooltip = useCallback(() => {
    clearCloseDelay();
    setOpen(true);
  }, [clearCloseDelay]);

  const scheduleClose = useCallback(() => {
    clearCloseDelay();
    closeDelayRef.current = window.setTimeout(() => {
      setVisible(false);
      setOpen(false);
    }, CLOSE_DELAY_MS);
  }, [clearCloseDelay]);

  const close = useCallback(() => {
    clearCloseDelay();
    setVisible(false);
    setOpen(false);
  }, [clearCloseDelay]);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelWidth = panelRect.width || Math.min(PANEL_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const panelHeight = panelRect.height || panel.offsetHeight;

    let left =
      placement === 'end'
        ? triggerRect.right - panelWidth
        : placement === 'start'
          ? triggerRect.left
          : triggerRect.left + triggerRect.width / 2 - panelWidth / 2;

    let top = triggerRect.bottom + 6;

    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + panelWidth > window.innerWidth - VIEWPORT_MARGIN) {
      left = window.innerWidth - VIEWPORT_MARGIN - panelWidth;
    }

    if (top + panelHeight > window.innerHeight - VIEWPORT_MARGIN) {
      top = triggerRect.top - panelHeight - 6;
    }
    if (top < VIEWPORT_MARGIN) top = VIEWPORT_MARGIN;

    setPanelStyle({
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: `${Math.round(panelWidth)}px`,
    });
  }, [placement]);

  useLayoutEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    setVisible(false);
    updatePanelPosition();
    setVisible(true);

    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open, updatePanelPosition, children]);

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

  useEffect(() => () => clearCloseDelay(), [clearCloseDelay]);

  return (
    <span
      ref={rootRef}
      className={`info-tooltip${open ? ' info-tooltip--open' : ''} ${className}`.trim()}
      onMouseEnter={openTooltip}
      onMouseLeave={scheduleClose}
      onFocusCapture={openTooltip}
      onBlurCapture={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        className="info-tooltip__trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (open) {
            close();
          } else {
            openTooltip();
          }
        }}
      >
        <span aria-hidden="true">i</span>
      </button>
      {open ? (
        <span
          ref={panelRef}
          id={panelId}
          role="tooltip"
          className={`info-tooltip__panel${visible ? ' info-tooltip__panel--visible' : ''}`}
          style={panelStyle}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
