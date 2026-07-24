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
import { useAuth } from '@clerk/nextjs';
import { useAdminApi } from '@/lib/use-admin-api';

export interface AdminContextData {
  user: {
    id: string;
    email: string;
    role: string;
  };
  agent: {
    displayName: string | null;
    jobTitle: string | null;
    isActive: boolean;
  } | null;
  isAdmin: boolean;
}

interface AdminContextValue {
  context: AdminContextData | null;
  loading: boolean;
  error: string;
  accessDenied: boolean;
  refreshContext: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { adminFetch, accessDenied } = useAdminApi();
  const [context, setContext] = useState<AdminContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshContext = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<AdminContextData>('/support/me');
      if (data) setContext(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load admin context');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    refreshContext();
  }, [isLoaded, isSignedIn, refreshContext]);

  const value = useMemo(
    () => ({ context, loading, error, accessDenied, refreshContext }),
    [context, loading, error, accessDenied, refreshContext],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext() {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error('useAdminContext must be used within AdminProvider');
  }
  return value;
}

export function useAdminData<T>(path: string, refreshIntervalMs?: number) {
  const { isLoaded, isSignedIn } = useAuth();
  const { adminFetch, accessDenied } = useAdminApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    if (!isLoaded || !isSignedIn) return;
    setLoading(true);
    setError('');
    try {
      const result = await adminFetch<T>(path);
      if (result) {
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [path, adminFetch, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh, path, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!path || !refreshIntervalMs || refreshIntervalMs <= 0) return;
    const timer = window.setInterval(refresh, refreshIntervalMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshIntervalMs]);

  return { data, loading, error, refresh, accessDenied, lastUpdated };
}
