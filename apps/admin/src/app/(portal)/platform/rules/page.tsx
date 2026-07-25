'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  ResponsiveTable,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

interface FaralinRuleRow {
  id: string;
  baseAmount: number;
  scoreMultiplier: number;
  improvementBonus: number;
  isActive: boolean;
  university: { name: string; slug: string };
  assessment: { title: string; slug: string } | null;
  subject: { name: string; slug: string } | null;
}

interface UniversityOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

export default function PlatformRulesPage() {
  const { data, loading, error, accessDenied, refresh } = useAdminData<FaralinRuleRow[]>(
    '/admin/faralin-rules',
  );
  const { data: universities } = useAdminData<UniversityOption[]>('/admin/universities');
  const { adminFetch } = useAdminApi();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FaralinRuleRow | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [universityId, setUniversityId] = useState('');
  const [baseAmount, setBaseAmount] = useState(100);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [improvementBonus, setImprovementBonus] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const openCreate = () => {
    setEditingRule(null);
    setUniversityId(universities?.[0]?.id ?? '');
    setBaseAmount(100);
    setScoreMultiplier(1);
    setImprovementBonus(0);
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (rule: FaralinRuleRow) => {
    setEditingRule(rule);
    setBaseAmount(rule.baseAmount);
    setScoreMultiplier(Number(rule.scoreMultiplier));
    setImprovementBonus(rule.improvementBonus);
    setIsActive(rule.isActive);
    setFormError('');
    setModalOpen(true);
  };

  const saveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingRule) {
        await adminFetch(`/admin/faralin-rules/${editingRule.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            baseAmount,
            scoreMultiplier,
            improvementBonus,
            isActive,
          }),
        });
      } else {
        if (!universityId) throw new Error('Select a university');
        await adminFetch('/admin/faralin-rules', {
          method: 'POST',
          body: JSON.stringify({
            universityId,
            baseAmount,
            scoreMultiplier,
            improvementBonus,
          }),
        });
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Faralin rules"
          description="Platform-wide recognition rule defaults by university"
          actions={
            <Button type="button" onClick={openCreate}>
              Add rule
            </Button>
          }
        />
        <Card>
          {error ? (
            <PageHeader title="Faralin rules" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No rules configured." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'uni', header: 'University', render: (r) => r.university.name },
                {
                  key: 'scope',
                  header: 'Scope',
                  render: (r) => r.assessment?.title ?? r.subject?.name ?? 'General',
                },
                { key: 'base', header: 'Base', render: (r) => r.baseAmount },
                { key: 'mult', header: 'Multiplier', render: (r) => r.scoreMultiplier },
                { key: 'active', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r) => (
                    <Button type="button" variant="secondary" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                  ),
                },
              ]}
              data={data}
              getRowKey={(r) => r.id}
              paginated
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              maxHeight="520px"
            />
          )}
        </Card>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingRule ? 'Edit Faralin rule' : 'Create Faralin rule'}
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="faralin-rule-form" disabled={saving}>
                {saving ? 'Saving…' : 'Save rule'}
              </Button>
            </>
          }
        >
          {formError ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{formError}</Alert>
            </div>
          ) : null}
          <form id="faralin-rule-form" className="form-stack" onSubmit={saveRule}>
            {!editingRule ? (
              <div className="form-row">
                <label htmlFor="rule-university">University</label>
                <select
                  id="rule-university"
                  required
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                >
                  <option value="">Select university</option>
                  {(universities ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p style={{ color: 'var(--faralin-muted)', margin: 0 }}>
                Editing rule for {editingRule.university.name}
              </p>
            )}
            <div className="form-row">
              <label htmlFor="rule-base">Base amount</label>
              <input
                id="rule-base"
                type="number"
                min={0}
                required
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
              />
            </div>
            <div className="form-row">
              <label htmlFor="rule-mult">Score multiplier</label>
              <input
                id="rule-mult"
                type="number"
                min={0}
                step={0.01}
                required
                value={scoreMultiplier}
                onChange={(e) => setScoreMultiplier(Number(e.target.value))}
              />
            </div>
            <div className="form-row">
              <label htmlFor="rule-improvement">Improvement bonus</label>
              <input
                id="rule-improvement"
                type="number"
                min={0}
                value={improvementBonus}
                onChange={(e) => setImprovementBonus(Number(e.target.value))}
              />
            </div>
            {editingRule ? (
              <div className="form-row">
                <label htmlFor="rule-active">
                  <input
                    id="rule-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />{' '}
                  Active
                </label>
              </div>
            ) : null}
          </form>
        </Modal>
      </div>
    </div>
  );
}
