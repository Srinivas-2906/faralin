'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiFetch } from '@faralin/utils';
import {
  Alert,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  Skeleton,
  StatCard,
} from '@faralin/ui';

export default function AdminPage() {
  const { getToken } = useAuth();
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [assessments, setAssessments] = useState<
    Array<{
      id: string;
      title: string;
      slug: string;
      isActive: boolean;
      _count: { questions: number; attempts: number };
    }>
  >([]);
  const [rules, setRules] = useState<
    Array<{ id: string; baseAmount: number; isActive: boolean; university: { name: string } }>
  >([]);
  const [universities, setUniversities] = useState<
    Array<{ id: string; name: string; slug: string; isDemo: boolean }>
  >([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const [ov, ass, rl, uni] = await Promise.all([
          apiFetch<Record<string, number>>('/admin/overview', { token: token ?? undefined }),
          apiFetch<typeof assessments>('/admin/assessments', { token: token ?? undefined }),
          apiFetch<typeof rules>('/admin/faralin-rules', { token: token ?? undefined }),
          apiFetch<typeof universities>('/admin/universities', { token: token ?? undefined }),
        ]);
        setOverview(ov);
        setAssessments(ass);
        setRules(rl);
        setUniversities(uni);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Admin access required');
      }
    }
    load();
  }, [getToken]);

  if (error) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader title="Admin panel" description={error} />
          </Card>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="page-section">
        <div className="container">
          <Skeleton variant="title" width="30%" style={{ marginBottom: '2rem' }} />
          <div className="stat-grid" style={{ marginBottom: '2rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="stat" />
            ))}
          </div>
          <div className="layout-two-col">
            <Skeleton variant="card" />
            <Skeleton variant="card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Admin panel" />

        <div className="stat-grid" style={{ marginBottom: 'var(--section-gap)' }}>
          {Object.entries(overview).map(([key, value]) => (
            <StatCard key={key} label={key} value={value} />
          ))}
        </div>

        <div className="layout-two-col" style={{ marginBottom: 'var(--section-gap)' }}>
          <Card>
            <h2 className="section-title">Assessments ({assessments.length})</h2>
            {assessments.length === 0 ? (
              <EmptyState compact message="No assessments." />
            ) : (
              <ResponsiveTable
                columns={[
                  { key: 'title', header: 'Title', render: (a) => a.title },
                  { key: 'questions', header: 'Q', render: (a) => a._count.questions },
                  { key: 'attempts', header: 'Attempts', render: (a) => a._count.attempts },
                  { key: 'active', header: 'Active', render: (a) => (a.isActive ? 'Yes' : 'No') },
                ]}
                data={assessments}
                getRowKey={(a) => a.id}
              />
            )}
          </Card>

          <Card>
            <h2 className="section-title">Faralin rules ({rules.length})</h2>
            {rules.length === 0 ? (
              <EmptyState compact message="No rules configured." />
            ) : (
              <ResponsiveTable
                columns={[
                  { key: 'uni', header: 'University', render: (r) => r.university.name },
                  { key: 'base', header: 'Base', render: (r) => r.baseAmount },
                  { key: 'active', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
                ]}
                data={rules.slice(0, 15)}
                getRowKey={(r) => r.id}
              />
            )}
          </Card>
        </div>

        <Card>
          <h2 className="section-title">Universities ({universities.length})</h2>
          {universities.length === 0 ? (
            <EmptyState compact message="No universities." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'name', header: 'Name', render: (u) => u.name },
                { key: 'slug', header: 'Slug', render: (u) => u.slug },
                { key: 'demo', header: 'Demo', render: (u) => (u.isDemo ? 'Yes' : 'No') },
              ]}
              data={universities}
              getRowKey={(u) => u.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
