'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { apiFetch } from '@faralin/utils';

export function useSupportApi() {
  const { getToken } = useAuth();

  const supportFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = (await getToken()) ?? undefined;
      return apiFetch<T>(path, { ...options, token });
    },
    [getToken],
  );

  return { supportFetch };
}
