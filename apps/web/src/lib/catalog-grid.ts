import { useEffect, useState, type RefObject } from 'react';

export const CATALOG_GRID_MIN_COL = 260;
export const CATALOG_GRID_GAP = 14;
export const CATALOG_GRID_BREAKPOINT = 640;

export function getCatalogGridColumns(width: number): number {
  if (width < CATALOG_GRID_BREAKPOINT) return 1;
  return Math.max(
    1,
    Math.floor((width + CATALOG_GRID_GAP) / (CATALOG_GRID_MIN_COL + CATALOG_GRID_GAP)),
  );
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function useCatalogGridColumns(containerRef: RefObject<HTMLElement | null>) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setColumns(getCatalogGridColumns(el.clientWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  return columns;
}
