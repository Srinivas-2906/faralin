export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; baseUrl?: string } = {},
): Promise<T> {
  const { token, baseUrl, ...fetchOptions } = options;
  const apiUrl = baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${apiUrl}/api${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Request failed');
  }

  return res.json();
}
