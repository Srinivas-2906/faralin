'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useState } from 'react';
import { apiFetch } from '@faralin/utils';

function isAccessDeniedError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('forbidden') ||
    lower.includes('insufficient permissions') ||
    message.includes('403')
  );
}

export function useStaffApi() {
  const { getToken } = useAuth();
  const [accessDenied, setAccessDenied] = useState(false);

  const staffFetch = useCallback(
    async <T,>(path: string, options: RequestInit & { token?: string } = {}): Promise<T | null> => {
      try {
        setAccessDenied(false);
        const token = options.token ?? (await getToken()) ?? undefined;
        return await apiFetch<T>(path, { ...options, token });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Request failed';
        if (isAccessDeniedError(message)) {
          setAccessDenied(true);
          return null;
        }
        throw e;
      }
    },
    [getToken],
  );

  return { staffFetch, accessDenied };
}
