'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface LibraryAssessment {
  id: string;
  slug: string;
  title: string;
  category: string;
  subjectName: string;
  levelLabel?: string | null;
  seriesSlug?: string | null;
  config: {
    enabled: boolean;
    isCompulsory: boolean;
    affectsBursaryEligibility?: boolean;
    unlocksAfterAssessmentId?: string | null;
    unlocksAfterTitle?: string | null;
  };
  reward: { baseAmount: number } | null;
}

interface LibraryCategory {
  category: string;
  label: string;
  assessments: LibraryAssessment[];
}

export default function AssessmentLibraryPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<{ categories: LibraryCategory[] }>(
        '/universities/staff/assessments/library',
      );
      if (data) setCategories(data.categories);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEnabled = async (assessment: LibraryAssessment) => {
    await staffFetch(`/universities/staff/assessments/${assessment.id}/config`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled: !assessment.config.enabled }),
    });
    await load();
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={4} />;

  const filtered =
    activeCategory === 'all'
      ? categories.flatMap((c) => c.assessments)
      : categories.find((c) => c.category === activeCategory)?.assessments ?? [];

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Assessment Library"
          description="Faralin templates — enable assessments and set rewards for your university."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <div className="portal-toolbar">
            <label className="portal-filter">
              Category
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          {error ? (
            <EmptyState compact message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState compact message="No assessments in this category." />
          ) : (
            <ResponsiveTable<LibraryAssessment>
              columns={[
                { key: 'title', header: 'Assessment', render: (row) => row.title },
                {
                  key: 'level',
                  header: 'Level',
                  render: (row) => row.levelLabel ?? '—',
                },
                {
                  key: 'prerequisite',
                  header: 'Prerequisite',
                  render: (row) => row.config.unlocksAfterTitle ?? '—',
                },
                {
                  key: 'category',
                  header: 'Category',
                  render: (row) =>
                    categories.find((c) => c.category === row.category)?.label ?? row.category,
                },
                {
                  key: 'reward',
                  header: 'Base reward',
                  render: (row) =>
                    row.reward?.baseAmount != null
                      ? row.reward.baseAmount.toLocaleString()
                      : '—',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge>{row.config.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Button
                      type="button"
                      variant={row.config.enabled ? 'secondary' : 'primary'}
                      onClick={() => toggleEnabled(row)}
                    >
                      {row.config.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  ),
                },
              ]}
              data={filtered}
              getRowKey={(row) => row.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
