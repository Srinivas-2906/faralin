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

export function useAdminApi() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [accessDenied, setAccessDenied] = useState(false);

  const adminFetch = useCallback(
    async <T,>(path: string, options: RequestInit & { token?: string } = {}): Promise<T | null> => {
      try {
        setAccessDenied(false);
        if (!options.token) {
          if (!isLoaded) return null;
          if (!isSignedIn) return null;
        }
        const token = options.token ?? (await getToken());
        if (!token) throw new Error('Not authenticated');
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
    [getToken, isLoaded, isSignedIn],
  );

  return { adminFetch, accessDenied };
}
