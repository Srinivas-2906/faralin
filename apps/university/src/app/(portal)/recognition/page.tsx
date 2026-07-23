'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface TierRow {
  tier: string;
  minVerifiedFaralins: number;
  benefitsSummary: string | null;
}

export default function RecognitionTiersPage() {
  const { getToken } = useAuth();
  const { staffFetch, accessDenied } = useStaffApi();
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await staffFetch<{ tiers: TierRow[] }>('/universities/staff/recognition-tiers');
    if (data) setTiers(data.tiers);
    setLoading(false);
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    await staffFetch('/universities/staff/recognition-tiers', {
      method: 'PATCH',
      body: JSON.stringify({ tiers }),
    });
    setSaving(false);
    await load();
  };

  const downloadHear = async () => {
    const token = await getToken();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/universities/staff/hear-export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const csv = await res.text();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hear-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={4} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Recognition Tiers"
          description="Configure verified Faralin thresholds and HEAR eligibility exports."
          actions={
            <>
              <Button type="button" variant="secondary" onClick={() => load()}>
                Refresh
              </Button>
              <Button type="button" variant="secondary" onClick={downloadHear}>
                Export HEAR CSV
              </Button>
            </>
          }
        />

        <Card>
          {tiers.length === 0 ? (
            <EmptyState compact message="No tier configuration found." />
          ) : (
            <div className="portal-tier-editor">
              {tiers.map((tier, index) => (
                <div key={tier.tier} className="portal-tier-row">
                  <strong>{tier.tier}</strong>
                  <label>
                    Min verified Faralins
                    <input
                      type="number"
                      value={tier.minVerifiedFaralins}
                      onChange={(e) => {
                        const next = [...tiers];
                        next[index] = {
                          ...tier,
                          minVerifiedFaralins: Number(e.target.value),
                        };
                        setTiers(next);
                      }}
                    />
                  </label>
                  <label>
                    Benefits summary
                    <input
                      type="text"
                      value={tier.benefitsSummary ?? ''}
                      onChange={(e) => {
                        const next = [...tiers];
                        next[index] = { ...tier, benefitsSummary: e.target.value };
                        setTiers(next);
                      }}
                    />
                  </label>
                </div>
              ))}
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save tiers'}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
