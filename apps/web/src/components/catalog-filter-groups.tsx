'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

type CatalogFilterGroupsContextValue = {
  groups: readonly CatalogFilterGroup[];
  activeValues: Record<string, string>;
  openGroupId: string | null;
  setOpenGroupId: (id: string | null | ((current: string | null) => string | null)) => void;
  setValue: (paramKey: string, nextValue: string) => void;
  parentLabel: (group: CatalogFilterGroup) => string;
  openGroup: CatalogFilterGroup | null;
};

const CatalogFilterGroupsContext = createContext<CatalogFilterGroupsContextValue | null>(null);

function useCatalogFilterGroupsContext() {
  const context = useContext(CatalogFilterGroupsContext);
  if (!context) {
    throw new Error('Catalog filter group components must be used within CatalogFilterGroupsProvider');
  }
  return context;
}

type CatalogFilterGroupsProviderProps = {
  basePath: string;
  groups: readonly CatalogFilterGroup[];
  children: ReactNode;
};

export function CatalogFilterGroupsProvider({
  basePath,
  groups,
  children,
}: CatalogFilterGroupsProviderProps) {
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

  const value = useMemo(
    () => ({
      groups,
      activeValues,
      openGroupId,
      setOpenGroupId,
      setValue,
      parentLabel,
      openGroup,
    }),
    [groups, activeValues, openGroupId, setValue, openGroup],
  );

  return (
    <CatalogFilterGroupsContext.Provider value={value}>{children}</CatalogFilterGroupsContext.Provider>
  );
}

export function CatalogFilterGroupParents() {
  const { groups, activeValues, openGroupId, setOpenGroupId, parentLabel } =
    useCatalogFilterGroupsContext();

  return (
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
  );
}

export function CatalogFilterGroupsPanel() {
  const { activeValues, openGroup, setValue } = useCatalogFilterGroupsContext();

  if (!openGroup) return null;

  return (
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
  );
}

type CatalogFilterGroupsProps = {
  basePath: string;
  groups: readonly CatalogFilterGroup[];
};

export function CatalogFilterGroups({ basePath, groups }: CatalogFilterGroupsProps) {
  return (
    <CatalogFilterGroupsProvider basePath={basePath} groups={groups}>
      <div className="catalog-filter-groups">
        <CatalogFilterGroupParents />
        <CatalogFilterGroupsPanel />
      </div>
    </CatalogFilterGroupsProvider>
  );
}
