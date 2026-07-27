'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Chip, InfoTooltip } from '@faralin/ui';
import type { CatalogFilterOption } from '@/components/catalog-filter-chips';

export type CatalogFilterGroup = {
  id: string;
  label: string;
  paramKey: string;
  options: readonly CatalogFilterOption[];
  tooltipLabel: string;
  tooltipContent: string;
};

type CatalogFilterGroupsProps = {
  basePath: string;
  groups: readonly CatalogFilterGroup[];
};

export function CatalogFilterGroups({ basePath, groups }: CatalogFilterGroupsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const activeValues = useMemo(() => {
    return Object.fromEntries(
      groups.map((group) => [group.paramKey, searchParams.get(group.paramKey) ?? '']),
    );
  }, [groups, searchParams]);

  const setValue = useCallback(
    (paramKey: string, nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        params.set(paramKey, nextValue);
      } else {
        params.delete(paramKey);
      }
      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [basePath, router, searchParams],
  );

  const openGroup = groups.find((group) => group.id === openGroupId) ?? null;

  function parentLabel(group: CatalogFilterGroup): string {
    const activeValue = activeValues[group.paramKey];
    if (!activeValue) return group.label;
    const activeOption = group.options.find((option) => option.value === activeValue);
    return activeOption ? `${group.label} · ${activeOption.label}` : group.label;
  }

  return (
    <div className="catalog-filter-groups">
      <div className="catalog-filter-groups-row" role="tablist" aria-label="Filter categories">
        {groups.map((group) => {
          const isOpen = openGroupId === group.id;
          const hasFilter = Boolean(activeValues[group.paramKey]);
          return (
            <div key={group.id} className="catalog-filter-group-trigger">
              <Chip
                className={`catalog-filter-group-chip catalog-filter-chip${
                  isOpen ? ' catalog-filter-group-chip--active selected' : ''
                }${hasFilter ? ' catalog-filter-group-chip--has-filter' : ''}`}
                selected={isOpen}
                aria-expanded={isOpen}
                aria-controls={`catalog-filter-panel-${group.id}`}
                onClick={() => setOpenGroupId((current) => (current === group.id ? null : group.id))}
              >
                {parentLabel(group)}
              </Chip>
              <InfoTooltip label={group.tooltipLabel}>{group.tooltipContent}</InfoTooltip>
            </div>
          );
        })}
      </div>

      {openGroup ? (
        <div
          id={`catalog-filter-panel-${openGroup.id}`}
          className="catalog-filter-groups-panel"
          role="tabpanel"
        >
          <div
            className="catalog-filter-chips-row"
            role="group"
            aria-label={`Filter by ${openGroup.label.toLowerCase()}`}
          >
            {openGroup.options.map((option) => {
              const currentValue = activeValues[openGroup.paramKey] ?? '';
              return (
                <Chip
                  key={option.value || `all-${openGroup.paramKey}`}
                  className="catalog-filter-chip"
                  selected={currentValue === option.value}
                  onClick={() => setValue(openGroup.paramKey, option.value)}
                >
                  {option.label}
                </Chip>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
