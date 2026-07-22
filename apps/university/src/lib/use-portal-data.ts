'use client';

import { useCallback, useEffect, useState } from 'react';
import { useStaffApi } from './use-staff-api';

interface PortalContext {
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

export function usePortalContext() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [context, setContext] = useState<PortalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<PortalContext>('/universities/staff/me');
      if (data) setContext(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portal context');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { context, loading, error, refresh, accessDenied };
}

export function usePortalData<T>(path: string) {
  const { staffFetch, accessDenied } = useStaffApi();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await staffFetch<T>(path);
      if (result) setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [path, staffFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, accessDenied };
}
