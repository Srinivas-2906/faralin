'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Card, EmptyState, PageHeader, Tabs } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { useStaffApi } from '@/lib/use-staff-api';

interface EnabledAssessment {
  id: string;
  title: string;
  reward: { baseAmount: number; scoreMultiplier: number; improvementBonus: number } | null;
  config: { bonusRules: Array<{ type: string; threshold?: number; amount: number }> };
}

interface EnabledTrack {
  id: string;
  title: string;
  maxFaralins: number;
  reward: { scoreMultiplier: number };
  config: { enabled: boolean; bonusRules: Array<{ type: string; threshold?: number; amount: number }> };
}

export default function RewardsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [tab, setTab] = useState<'assessments' | 'tracks'>('assessments');
  const [assessments, setAssessments] = useState<EnabledAssessment[]>([]);
  const [tracks, setTracks] = useState<EnabledTrack[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [assessmentData, trackData] = await Promise.all([
        staffFetch<{
          categories: Array<{
            assessments: Array<{
              id: string;
              title: string;
              config: { enabled: boolean; bonusRules: EnabledAssessment['config']['bonusRules'] };
              reward: EnabledAssessment['reward'];
            }>;
          }>;
        }>('/universities/staff/assessments/library'),
        staffFetch<{ tracks: Array<EnabledTrack & { config: { enabled: boolean } }> }>(
          '/universities/staff/tracks/library',
        ),
      ]);

      if (assessmentData) {
        const enabled = assessmentData.categories
          .flatMap((c) => c.assessments)
          .filter((a) => a.config.enabled)
          .map((a) => ({
            id: a.id,
            title: a.title,
            reward: a.reward,
            config: { bonusRules: a.config.bonusRules ?? [] },
          }));
        setAssessments(enabled);
        setSelectedAssessmentId((current) => current ?? enabled[0]?.id ?? null);
      }

      if (trackData) {
        const enabled = trackData.tracks
          .filter((t) => t.config.enabled)
          .map((t) => ({
            id: t.id,
            title: t.title,
            maxFaralins: t.maxFaralins,
            reward: t.reward ?? { scoreMultiplier: 1 },
            config: { enabled: t.config.enabled, bonusRules: t.config.bonusRules ?? [] },
          }));
        setTracks(enabled);
        setSelectedTrackId((current) => current ?? enabled[0]?.id ?? null);
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

  const selectedAssessment =
    assessments.find((a) => a.id === selectedAssessmentId) ?? assessments[0] ?? null;
  const selectedTrack = tracks.find((t) => t.id === selectedTrackId) ?? tracks[0] ?? null;

  const saveAssessmentReward = async (assessment: EnabledAssessment, form: FormData) => {
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

  const saveTrackReward = async (track: EnabledTrack, form: FormData) => {
    setSavingId(track.id);
    try {
      const scoreMultiplier = Number(form.get('scoreMultiplier') || 1);
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

      await staffFetch(`/universities/staff/tracks/${track.id}/reward`, {
        method: 'PATCH',
        body: JSON.stringify({ scoreMultiplier }),
      });
      await staffFetch(`/universities/staff/tracks/${track.id}/config`, {
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
          description="Configure Faralin payouts for enabled assessments and problem tracks."
          actions={
            <Button type="button" variant="secondary" onClick={() => load()}>
              Refresh
            </Button>
          }
        />

        <Tabs
          tabs={[
            { id: 'assessments', label: 'Assessments' },
            { id: 'tracks', label: 'Problem tracks' },
          ]}
          activeId={tab}
          onChange={(id) => setTab(id as 'assessments' | 'tracks')}
        />

        {error ? (
          <Card>
            <EmptyState compact message={error} />
          </Card>
        ) : tab === 'assessments' ? (
          assessments.length === 0 ? (
            <Card>
              <EmptyState compact message="Enable assessments in the library to configure rewards." />
            </Card>
          ) : (
            <div className="portal-rewards-split">
              <Card className="portal-rewards-list-panel">
                <h2 className="section-title">Enabled assessments</h2>
                <ul className="portal-rewards-picker">
                  {assessments.map((assessment) => (
                    <li key={assessment.id}>
                      <button
                        type="button"
                        className={`portal-rewards-picker-item${
                          selectedAssessment?.id === assessment.id
                            ? ' portal-rewards-picker-item-active'
                            : ''
                        }`}
                        onClick={() => setSelectedAssessmentId(assessment.id)}
                      >
                        {assessment.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>

              {selectedAssessment ? (
                <Card className="portal-rewards-editor-panel">
                  <AssessmentRewardForm
                    key={selectedAssessment.id}
                    assessment={selectedAssessment}
                    saving={savingId === selectedAssessment.id}
                    onSave={saveAssessmentReward}
                  />
                </Card>
              ) : null}
            </div>
          )
        ) : tracks.length === 0 ? (
          <Card>
            <EmptyState compact message="Enable problem tracks to configure rewards." />
          </Card>
        ) : (
          <div className="portal-rewards-split">
            <Card className="portal-rewards-list-panel">
              <h2 className="section-title">Enabled tracks</h2>
              <ul className="portal-rewards-picker">
                {tracks.map((track) => (
                  <li key={track.id}>
                    <button
                      type="button"
                      className={`portal-rewards-picker-item${
                        selectedTrack?.id === track.id ? ' portal-rewards-picker-item-active' : ''
                      }`}
                      onClick={() => setSelectedTrackId(track.id)}
                    >
                      {track.title}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            {selectedTrack ? (
              <Card className="portal-rewards-editor-panel">
                <TrackRewardForm
                  key={selectedTrack.id}
                  track={selectedTrack}
                  saving={savingId === selectedTrack.id}
                  onSave={saveTrackReward}
                />
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function AssessmentRewardForm({
  assessment,
  saving,
  onSave,
}: {
  assessment: EnabledAssessment;
  saving: boolean;
  onSave: (assessment: EnabledAssessment, form: FormData) => void;
}) {
  const scoreAbove = assessment.config.bonusRules.find((r) => r.type === 'SCORE_ABOVE') ?? null;
  const perfect = assessment.config.bonusRules.find((r) => r.type === 'PERFECT_SCORE') ?? null;
  const firstAttempt = assessment.config.bonusRules.find((r) => r.type === 'FIRST_ATTEMPT') ?? null;

  return (
    <form
      className="portal-reward-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(assessment, new FormData(e.currentTarget));
      }}
    >
      <h2 className="section-title">{assessment.title}</h2>
      <div className="form-row portal-reward-base">
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
      <BonusFields
        idPrefix={assessment.id}
        scoreAbove={scoreAbove}
        perfect={perfect}
        firstAttempt={firstAttempt}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save reward rules'}
      </Button>
    </form>
  );
}

function TrackRewardForm({
  track,
  saving,
  onSave,
}: {
  track: EnabledTrack;
  saving: boolean;
  onSave: (track: EnabledTrack, form: FormData) => void;
}) {
  const scoreAbove = track.config.bonusRules.find((r) => r.type === 'SCORE_ABOVE') ?? null;
  const perfect = track.config.bonusRules.find((r) => r.type === 'PERFECT_SCORE') ?? null;
  const firstAttempt = track.config.bonusRules.find((r) => r.type === 'FIRST_ATTEMPT') ?? null;

  return (
    <form
      className="portal-reward-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(track, new FormData(e.currentTarget));
      }}
    >
      <h2 className="section-title">{track.title}</h2>
      <p className="portal-table-meta">Platform max: {track.maxFaralins.toLocaleString()} Faralins</p>
      <div className="form-row portal-reward-base">
        <label htmlFor={`mult-${track.id}`}>Score multiplier</label>
        <input
          id={`mult-${track.id}`}
          name="scoreMultiplier"
          type="number"
          min={0}
          step={0.01}
          defaultValue={track.reward.scoreMultiplier}
          required
        />
      </div>
      <BonusFields
        idPrefix={track.id}
        scoreAbove={scoreAbove}
        perfect={perfect}
        firstAttempt={firstAttempt}
      />
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving…' : 'Save track reward rules'}
      </Button>
    </form>
  );
}

function BonusFields({
  idPrefix,
  scoreAbove,
  perfect,
  firstAttempt,
}: {
  idPrefix: string;
  scoreAbove: { threshold?: number; amount: number } | null;
  perfect: { amount: number } | null;
  firstAttempt: { amount: number } | null;
}) {
  return (
    <div className="portal-reward-bonus-grid">
      <div className="form-row">
        <label htmlFor={`score-th-${idPrefix}`}>Score above %</label>
        <input
          id={`score-th-${idPrefix}`}
          name="scoreAboveThreshold"
          type="number"
          min={0}
          max={100}
          defaultValue={scoreAbove?.threshold ?? 80}
        />
      </div>
      <div className="form-row">
        <label htmlFor={`score-bonus-${idPrefix}`}>Score bonus</label>
        <input
          id={`score-bonus-${idPrefix}`}
          name="scoreAboveBonus"
          type="number"
          min={0}
          defaultValue={scoreAbove?.amount ?? 0}
        />
      </div>
      <div className="form-row">
        <label htmlFor={`perfect-${idPrefix}`}>Perfect score bonus</label>
        <input
          id={`perfect-${idPrefix}`}
          name="perfectBonus"
          type="number"
          min={0}
          defaultValue={perfect?.amount ?? 0}
        />
      </div>
      <div className="form-row">
        <label htmlFor={`first-${idPrefix}`}>First attempt bonus</label>
        <input
          id={`first-${idPrefix}`}
          name="firstAttemptBonus"
          type="number"
          min={0}
          defaultValue={firstAttempt?.amount ?? 0}
        />
      </div>
    </div>
  );
}
