'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface CampaignRow {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  budgetGbp: number;
  perStudentCapGbp: number | null;
  universityBoost: number;
  subjectAlignmentBoost: number;
  startsAt: string;
  endsAt: string;
  deliveryType: string;
}

export default function CampaignsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<CampaignRow[]>('/universities/staff/campaigns');
      setCampaigns(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const createCampaign = async (form: FormData) => {
    setSaving(true);
    setError('');
    try {
      const name = String(form.get('name') ?? '').trim();
      const slug = String(form.get('slug') ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      const startsAt = String(form.get('startsAt'));
      const endsAt = String(form.get('endsAt'));
      await staffFetch('/universities/staff/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug,
          budgetGbp: Number(form.get('budgetGbp')),
          perStudentCapGbp: form.get('perStudentCapGbp')
            ? Number(form.get('perStudentCapGbp'))
            : null,
          universityBoost: Number(form.get('universityBoost')),
          subjectAlignmentBoost: Number(form.get('subjectAlignmentBoost') || 1),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          deliveryType: String(form.get('deliveryType') || 'BURSARY'),
          isActive: true,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id: string) => {
    setSaving(true);
    try {
      await staffFetch(`/universities/staff/campaigns/${id}/deactivate`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate campaign');
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton />;

  return (
    <div className="portal-page">
      <PageHeader
        title="Campaigns"
        description="Set recruitment boosts and caps that drive conditional award projections. Prestige tiers stay discovery labels only."
      />
      {error ? <p className="text-danger">{error}</p> : null}

      <Card className="portal-card">
        <h2>Active and scheduled campaigns</h2>
        {campaigns.length === 0 ? (
          <EmptyState compact message="No campaigns yet. Create one to replace prestige-based projections." />
        ) : (
          <ul className="portal-list">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className="portal-list-item">
                <div>
                  <strong>{campaign.name}</strong>
                  <p className="text-muted">
                    Boost {campaign.universityBoost.toFixed(2)} · Budget £
                    {campaign.budgetGbp.toLocaleString()} · {campaign.deliveryType}
                    {campaign.isActive ? ' · Active' : ' · Inactive'}
                  </p>
                  <p className="text-muted">
                    {new Date(campaign.startsAt).toLocaleDateString()} –{' '}
                    {new Date(campaign.endsAt).toLocaleDateString()}
                  </p>
                </div>
                {campaign.isActive ? (
                  <Button
                    variant="secondary"
                    disabled={saving}
                    onClick={() => deactivate(campaign.id)}
                  >
                    Deactivate
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="portal-card">
        <h2>Create campaign</h2>
        <form
          className="portal-form"
          onSubmit={(event) => {
            event.preventDefault();
            void createCampaign(new FormData(event.currentTarget));
            event.currentTarget.reset();
          }}
        >
          <label>
            Name
            <input name="name" required />
          </label>
          <label>
            Slug
            <input name="slug" required placeholder="2026-main" />
          </label>
          <label>
            Budget (£)
            <input name="budgetGbp" type="number" min={0} step="0.01" required />
          </label>
          <label>
            Per-student cap (£)
            <input name="perStudentCapGbp" type="number" min={0} step="0.01" />
          </label>
          <label>
            University boost (0.5–1.5)
            <input name="universityBoost" type="number" min={0.5} max={1.5} step="0.01" defaultValue={1} required />
          </label>
          <label>
            Subject alignment boost
            <input name="subjectAlignmentBoost" type="number" min={0.5} max={1.5} step="0.01" defaultValue={1} />
          </label>
          <label>
            Starts
            <input name="startsAt" type="date" required />
          </label>
          <label>
            Ends
            <input name="endsAt" type="date" required />
          </label>
          <label>
            Delivery type
            <select name="deliveryType" defaultValue="BURSARY">
              <option value="BURSARY">Bursary</option>
              <option value="FEE_WAIVER">Fee waiver</option>
              <option value="SCHOLARSHIP">Scholarship</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create campaign'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
