'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip } from '@faralin/ui';

export type CatalogFilterOption = {
  value: string;
  label: string;
};

type CatalogFilterChipsProps = {
  options: readonly CatalogFilterOption[];
  paramKey: string;
  ariaLabel: string;
  basePath: string;
};

export function CatalogFilterChips({
  options,
  paramKey,
  ariaLabel,
  basePath,
}: CatalogFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get(paramKey) ?? '';

  const setValue = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        params.set(paramKey, nextValue);
      } else {
        params.delete(paramKey);
      }
      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [basePath, paramKey, router, searchParams],
  );

  return (
    <div className="catalog-filter-chips-row" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <Chip
          key={option.value || `all-${paramKey}`}
          className="catalog-filter-chip"
          selected={value === option.value}
          onClick={() => setValue(option.value)}
        >
          {option.label}
        </Chip>
      ))}
    </div>
  );
}
