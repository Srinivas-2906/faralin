'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface EnabledAssessment {
  id: string;
  title: string;
  reward: { baseAmount: number; scoreMultiplier: number; improvementBonus: number } | null;
  config: { bonusRules: Array<{ type: string; threshold?: number; amount: number }> };
}

export default function RewardsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [assessments, setAssessments] = useState<EnabledAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await staffFetch<{
        categories: Array<{
          assessments: Array<{
            id: string;
            title: string;
            config: { enabled: boolean; bonusRules: EnabledAssessment['config']['bonusRules'] };
            reward: EnabledAssessment['reward'];
          }>;
        }>;
      }>('/universities/staff/assessments/library');
      if (data) {
        const enabled = data.categories
          .flatMap((c) => c.assessments)
          .filter((a) => a.config.enabled)
          .map((a) => ({
            id: a.id,
            title: a.title,
            reward: a.reward,
            config: { bonusRules: a.config.bonusRules ?? [] },
          }));
        setAssessments(enabled);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rewards');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  const saveReward = async (assessment: EnabledAssessment, form: FormData) => {
    setSavingId(assessment.id);
    try {
      const baseAmount = Number(form.get('baseAmount'));
      const scoreAboveThreshold = Number(form.get('scoreAboveThreshold') || 80);
      const scoreAboveBonus = Number(form.get('scoreAboveBonus') || 0);
      const perfectBonus = Number(form.get('perfectBonus') || 0);
      const firstAttemptBonus = Number(form.get('firstAttemptBonus') || 0);

      const bonusRules = [];
      if (scoreAboveBonus > 0) {
        bonusRules.push({
          type: 'SCORE_ABOVE',
          threshold: scoreAboveThreshold,
          amount: scoreAboveBonus,
        });
      }
      if (perfectBonus > 0) bonusRules.push({ type: 'PERFECT_SCORE', amount: perfectBonus });
      if (firstAttemptBonus > 0) {
        bonusRules.push({ type: 'FIRST_ATTEMPT', amount: firstAttemptBonus });
      }

      await staffFetch(`/universities/staff/assessments/${assessment.id}/reward`, {
        method: 'PATCH',
        body: JSON.stringify({ baseAmount }),
      });
      await staffFetch(`/universities/staff/assessments/${assessment.id}/config`, {
        method: 'PATCH',
        body: JSON.stringify({ bonusRules }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (accessDenied) return <AccessDenied />;
  if (loading) return <PortalPageSkeleton rows={4} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Rewards"
          description="Set base Faralins and bonus rules for enabled assessments."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        {error ? (
          <Card>
            <EmptyState compact message={error} />
          </Card>
        ) : assessments.length === 0 ? (
          <Card>
            <EmptyState compact message="Enable assessments in the library to configure rewards." />
          </Card>
        ) : (
          <div className="portal-rewards-list">
            {assessments.map((assessment) => {
              const scoreAbove =
                assessment.config.bonusRules.find((r) => r.type === 'SCORE_ABOVE') ?? null;
              const perfect =
                assessment.config.bonusRules.find((r) => r.type === 'PERFECT_SCORE') ?? null;
              const firstAttempt =
                assessment.config.bonusRules.find((r) => r.type === 'FIRST_ATTEMPT') ?? null;

              return (
                <Card key={assessment.id} className="portal-reward-card">
                  <h2 className="section-title">{assessment.title}</h2>
                  <form
                    className="portal-reward-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveReward(assessment, new FormData(e.currentTarget));
                    }}
                  >
                    <div className="form-row">
                      <label htmlFor={`base-${assessment.id}`}>Base reward (Faralins)</label>
                      <input
                        id={`base-${assessment.id}`}
                        name="baseAmount"
                        type="number"
                        min={0}
                        defaultValue={assessment.reward?.baseAmount ?? 100}
                        required
                      />
                    </div>
                    <div className="portal-reward-bonus-grid">
                      <div className="form-row">
                        <label htmlFor={`score-th-${assessment.id}`}>Score above %</label>
                        <input
                          id={`score-th-${assessment.id}`}
                          name="scoreAboveThreshold"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={scoreAbove?.threshold ?? 80}
                        />
                      </div>
                      <div className="form-row">
                        <label htmlFor={`score-bonus-${assessment.id}`}>Score bonus</label>
                        <input
                          id={`score-bonus-${assessment.id}`}
                          name="scoreAboveBonus"
                          type="number"
                          min={0}
                          defaultValue={scoreAbove?.amount ?? 0}
                        />
                      </div>
                      <div className="form-row">
                        <label htmlFor={`perfect-${assessment.id}`}>Perfect score bonus</label>
                        <input
                          id={`perfect-${assessment.id}`}
                          name="perfectBonus"
                          type="number"
                          min={0}
                          defaultValue={perfect?.amount ?? 0}
                        />
                      </div>
                      <div className="form-row">
                        <label htmlFor={`first-${assessment.id}`}>First attempt bonus</label>
                        <input
                          id={`first-${assessment.id}`}
                          name="firstAttemptBonus"
                          type="number"
                          min={0}
                          defaultValue={firstAttempt?.amount ?? 0}
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={savingId === assessment.id}>
                      {savingId === assessment.id ? 'Saving…' : 'Save reward rules'}
                    </Button>
                  </form>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
