'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface LeaderboardConfig {
  enabled: boolean;
  scope: string;
  optInRequired: boolean;
}

export default function LeaderboardPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [config, setConfig] = useState<LeaderboardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<LeaderboardConfig>('/universities/staff/leaderboard/config');
      if (data) setConfig(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load leaderboard config');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    try {
      await staffFetch('/universities/staff/leaderboard/config', {
        method: 'PATCH',
        body: JSON.stringify(config),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={4} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Leaderboard"
          description="Configure the public follower leaderboard for your university."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        <Card>
          {error ? <EmptyState compact message={error} /> : null}
          {config ? (
            <div className="portal-tier-editor">
              <label className="portal-checkbox-row">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
                Enable public leaderboard
              </label>
              <label className="portal-checkbox-row">
                <input
                  type="checkbox"
                  checked={config.optInRequired}
                  onChange={(e) => setConfig({ ...config, optInRequired: e.target.checked })}
                />
                Require student opt-in before appearing
              </label>
              <div className="form-row">
                <label htmlFor="leaderboard-scope">Ranking scope</label>
                <select
                  id="leaderboard-scope"
                  value={config.scope}
                  onChange={(e) => setConfig({ ...config, scope: e.target.value })}
                >
                  <option value="VERIFIED_FARALINS">Verified Faralins</option>
                </select>
              </div>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save leaderboard settings'}
              </Button>
            </div>
          ) : (
            <EmptyState compact message="Leaderboard configuration unavailable." />
          )}
        </Card>
      </div>
    </div>
  );
}
