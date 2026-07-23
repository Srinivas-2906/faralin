'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useStaffApi } from '@/lib/use-staff-api';

export interface PortalContextData {
  university: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    shortName: string;
  };
  staff: {
    email: string;
    jobTitle: string | null;
  };
}

interface PortalContextValue {
  context: PortalContextData | null;
  loading: boolean;
  error: string;
  accessDenied: boolean;
  refreshContext: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: ReactNode }) {
  const { staffFetch, accessDenied } = useStaffApi();
  const [context, setContext] = useState<PortalContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshContext = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<PortalContextData>('/universities/staff/me');
      if (data) setContext(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portal context');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  const value = useMemo(
    () => ({ context, loading, error, accessDenied, refreshContext }),
    [context, loading, error, accessDenied, refreshContext],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortalContext() {
  const value = useContext(PortalContext);
  if (!value) {
    throw new Error('usePortalContext must be used within PortalProvider');
  }
  return value;
}

export function usePortalData<T>(path: string, refreshIntervalMs?: number) {
  const { staffFetch, accessDenied } = useStaffApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await staffFetch<T>(path);
      if (result) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [path, staffFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs <= 0) return;
    const timer = window.setInterval(refresh, refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { data, loading, error, refresh, accessDenied, lastUpdated };
}
