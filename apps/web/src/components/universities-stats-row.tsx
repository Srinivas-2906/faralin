'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UniversitiesCatalogInsight } from '@/components/catalog-insight';

export function UniversitiesStatsRow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    const next = params.toString();
    router.replace(next ? `/universities?${next}` : '/universities');
  }

  return (
    <div className="universities-stats-row">
      <UniversitiesCatalogInsight />

      <div className="universities-stats-actions">
        <form className="universities-search" onSubmit={handleSubmit} role="search">
          <svg
            className="universities-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search partner universities"
            aria-label="Search partner universities"
          />
        </form>
      </div>
    </div>
  );
}
