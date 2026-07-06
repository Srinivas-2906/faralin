'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROBLEM_SECTION_TYPE_LABELS,
  SUBMISSION_TRUST_LABELS,
  TRACK_DIFFICULTY_LABELS,
} from '@faralin/types';
import type { ProblemTrackInputField, ProblemTrackSection } from '@faralin/types';
import { Alert, Badge, Button, Card, MediaImage, Skeleton } from '@faralin/ui';
import { apiFetch } from '@faralin/utils';
import { getSubjectImage, getAssessmentImageFallback } from '@/lib/media';
import { renderTrackMarkdown } from '@/lib/track-markdown';

interface AttemptState {
  attemptId: string;
  status: string;
  msRemaining: number;
  currentSectionId: string | null;
  track: {
    slug: string;
    title: string;
    subtitle: string | null;
    maxFaralins: number;
    subject?: { name: string };
  };
  sections: Array<{ id: string; type: string; title: string; unlocked: boolean; complete: boolean }>;
  stepResponses: Array<{
    sectionId: string;
    response: Record<string, unknown>;
    aiFeedback: { message?: string } | null;
    isComplete: boolean;
  }>;
  fullSections: ProblemTrackSection[];
  result: {
    rubricScore: number;
    rubricBreakdown: Array<{ name: string; score: number; feedback: string }>;
    faralinsEarned: number;
    awardBandLabel: string;
    trustLevel: string;
    moderationStatus: string;
    feedbackSummary: { strengths?: string[]; improvements?: string[] };
  } | null;
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function SectionInput({
  field,
  value,
  onChange,
  onPaste,
}: {
  field: ProblemTrackInputField;
  value: string;
  onChange: (v: string) => void;
  onPaste: () => void;
}) {
  if (field.type === 'multiple_choice' && field.options) {
    return (
      <div className="track-input-options">
        {field.options.map((opt) => (
          <label key={opt} className="track-input-option">
            <input
              type="radio"
              name={field.id}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === 'long_text') {
    return (
      <textarea
        className="track-textarea"
        rows={8}
        value={value}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
      />
    );
  }

  return (
    <input
      className="track-input"
      type={field.type === 'number' ? 'number' : 'text'}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onPaste={onPaste}
    />
  );
}

export function TrackStepRunner({ slug }: { slug: string }) {
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<AttemptState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localResponses, setLocalResponses] = useState<Record<string, Record<string, string>>>({});
  const [copyPasteCount, setCopyPasteCount] = useState(0);
  const sectionStartRef = useRef(Date.now());
  const [msRemaining, setMsRemaining] = useState(0);

  const activeSection = useMemo(() => {
    if (!state) return null;
    const id = state.currentSectionId ?? state.sections.find((s) => s.unlocked && !s.complete)?.id;
    return state.fullSections.find((s) => s.id === id) ?? state.fullSections[0];
  }, [state]);

  const loadAttempt = useCallback(async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    const token = await getToken();
    if (!token) return;

    try {
      const started = await apiFetch<AttemptState>(`/problem-tracks/${slug}/start`, {
        method: 'POST',
        token,
      });
      const full = await apiFetch<AttemptState>(`/problem-tracks/attempts/${started.attemptId}`, {
        token,
      });
      setState(full);
      setMsRemaining(full.msRemaining);

      const initial: Record<string, Record<string, string>> = {};
      for (const r of full.stepResponses) {
        const resp: Record<string, string> = {};
        for (const [k, v] of Object.entries(r.response as Record<string, unknown>)) {
          resp[k] = String(v ?? '');
        }
        initial[r.sectionId] = resp;
      }
      setLocalResponses(initial);

      if (full.status !== 'IN_PROGRESS' && full.result) {
        router.replace(`/tracks/${slug}/result?attempt=${full.attemptId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load track');
    } finally {
      setLoading(false);
    }
  }, [getToken, isSignedIn, router, slug]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  useEffect(() => {
    if (!state || state.status !== 'IN_PROGRESS') return;
    const t = setInterval(() => {
      setMsRemaining((m) => Math.max(0, m - 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    sectionStartRef.current = Date.now();
  }, [activeSection?.id]);

  const getResponse = (sectionId: string) => localResponses[sectionId] ?? {};

  const setField = (sectionId: string, fieldId: string, value: string) => {
    setLocalResponses((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [fieldId]: value },
    }));
  };

  const saveSection = async (section: ProblemTrackSection, advance = true) => {
    if (!state) return;
    setSaving(true);
    setError('');
    const token = await getToken();
    const timeSpentMs = Date.now() - sectionStartRef.current;

    try {
      const updated = await apiFetch<AttemptState>(
        `/problem-tracks/attempts/${state.attemptId}/steps/${section.id}`,
        {
          method: 'PATCH',
          token: token!,
          body: JSON.stringify({
            response: getResponse(section.id),
            timeSpentMs,
            copyPasteCount,
          }),
        },
      );
      setState(updated);
      setCopyPasteCount(0);
      sectionStartRef.current = Date.now();

      if (section.type === 'SUBMIT' && advance) {
        await submitTrack(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const requestAiFeedback = async () => {
    if (!state || !activeSection) return;
    setAiLoading(true);
    const token = await getToken();
    try {
      await saveSection(activeSection, false);
      const feedback = await apiFetch<{ message: string }>(
        `/problem-tracks/attempts/${state.attemptId}/steps/${activeSection.id}/ai-feedback`,
        { method: 'POST', token: token! },
      );
      setState((prev) => {
        if (!prev) return prev;
        const stepResponses = [...prev.stepResponses];
        const idx = stepResponses.findIndex((r) => r.sectionId === activeSection.id);
        const entry = {
          sectionId: activeSection.id,
          response: getResponse(activeSection.id),
          aiFeedback: feedback,
          isComplete: idx >= 0 ? stepResponses[idx]!.isComplete : false,
        };
        if (idx >= 0) stepResponses[idx] = entry;
        else stepResponses.push(entry);
        return { ...prev, stepResponses };
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI feedback failed');
    } finally {
      setAiLoading(false);
    }
  };

  const generateDraft = async () => {
    if (!state) return;
    setDraftLoading(true);
    const token = await getToken();
    try {
      const { draft } = await apiFetch<{ draft: string }>(
        `/problem-tracks/attempts/${state.attemptId}/final-builder`,
        { method: 'POST', token: token! },
      );
      setField('final_builder', 'final_draft', draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Draft generation failed');
    } finally {
      setDraftLoading(false);
    }
  };

  const submitTrack = async (currentState = state) => {
    if (!currentState) return;
    const finalDraft = getResponse('final_builder').final_draft ?? '';
    if (finalDraft.length < 100) {
      setError('Complete and edit your final investigation before submitting.');
      return;
    }
    setSubmitting(true);
    const token = await getToken();
    try {
      await apiFetch(`/problem-tracks/attempts/${currentState.attemptId}/submit`, {
        method: 'POST',
        token: token!,
        body: JSON.stringify({ finalSubmission: finalDraft }),
      });
      router.push(`/tracks/${slug}/result?attempt=${currentState.attemptId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <p>Sign in to start this Problem Track.</p>
        <Link href="/sign-in">
          <Button>Sign in</Button>
        </Link>
      </Card>
    );
  }

  if (loading) return <Skeleton height={400} />;
  if (!state || !activeSection) {
    return <Alert variant="error">{error || 'Track not found'}</Alert>;
  }

  const aiFeedback = state.stepResponses.find((r) => r.sectionId === activeSection.id)?.aiFeedback;
  const sectionIndex = state.fullSections.findIndex((s) => s.id === activeSection.id);
  const completedCount = state.sections.filter((s) => s.complete).length;
  const progressPct = Math.round((completedCount / state.fullSections.length) * 100);
  const urgentTime = msRemaining > 0 && msRemaining < 24 * 60 * 60 * 1000;

  return (
    <div className="track-runner">
      <header className="track-runner-header track-runner-header--sticky">
        <div>
          <div className="media-card-eyebrow">{state.track.subject?.name ?? 'Problem Track'}</div>
          <h1 className="track-runner-title">{state.track.title}</h1>
        </div>
        <div className="track-runner-meta">
          <Badge className={urgentTime ? 'track-time-badge track-time-badge--urgent' : 'track-time-badge'}>
            {formatTime(msRemaining)} left
          </Badge>
          <span className="text-muted">
            Step {sectionIndex + 1} of {state.fullSections.length}
          </span>
        </div>
      </header>

      <div className="track-progress-bar" aria-label="Track progress">
        <div className="track-progress-fill" style={{ width: `${progressPct}%` }} />
        <span className="track-progress-label">
          {completedCount} of {state.fullSections.length} steps complete
        </span>
      </div>

      <div className="track-runner-layout">
        <nav className="track-curriculum" aria-label="Track progress">
          {state.sections.map((s, i) => {
            const typeLabel =
              PROBLEM_SECTION_TYPE_LABELS[s.type as keyof typeof PROBLEM_SECTION_TYPE_LABELS] ??
              s.title;
            return (
              <div
                key={s.id}
                className={`track-curriculum-item${s.id === activeSection.id ? ' track-curriculum-item--active' : ''}${s.complete ? ' track-curriculum-item--done' : ''}${!s.unlocked ? ' track-curriculum-item--locked' : ''}`}
              >
                <span className="track-curriculum-num" aria-hidden="true">
                  {s.complete ? '✓' : !s.unlocked ? '🔒' : i + 1}
                </span>
                <span className="track-curriculum-copy">
                  <span className="track-curriculum-type">{typeLabel}</span>
                  <span className="track-curriculum-label">{s.title}</span>
                </span>
              </div>
            );
          })}
        </nav>

        <Card
          className={`track-step-card track-step-card--${activeSection.type.toLowerCase().replace(/_/g, '-')}`}
        >
          <Badge>{PROBLEM_SECTION_TYPE_LABELS[activeSection.type]}</Badge>
          <h2 className="track-step-title">{activeSection.title}</h2>
          <div
            className="track-step-content prose"
            dangerouslySetInnerHTML={{
              __html: renderTrackMarkdown(activeSection.content),
            }}
          />

          {activeSection.inputs.map((field) => (
            <div key={field.id} className="track-field">
              <label className="track-field-label">{field.label}</label>
              <SectionInput
                field={field}
                value={getResponse(activeSection.id)[field.id] ?? ''}
                onChange={(v) => setField(activeSection.id, field.id, v)}
                onPaste={() => setCopyPasteCount((c) => c + 1)}
              />
            </div>
          ))}

          {aiFeedback?.message ? (
            <div className="track-ai-callout" role="status">
              <strong>AI tutor</strong>
              <p>{aiFeedback.message}</p>
            </div>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="track-step-actions">
            {activeSection.type === 'FINAL_BUILDER' ? (
              <Button variant="secondary" onClick={generateDraft} disabled={draftLoading}>
                {draftLoading ? 'Generating…' : 'Generate draft from my answers'}
              </Button>
            ) : null}
            {['LEARN', 'PRACTICE', 'SOLVE', 'PERSONALISE', 'REFLECT'].includes(activeSection.type) ? (
              <Button variant="secondary" onClick={requestAiFeedback} disabled={aiLoading}>
                {aiLoading ? 'Thinking…' : 'Ask AI tutor'}
              </Button>
            ) : null}
            {activeSection.type === 'SUBMIT' ? (
              <Button onClick={() => submitTrack()} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Lock & submit'}
              </Button>
            ) : (
              <Button
                onClick={() => saveSection(activeSection)}
                disabled={saving || !state.sections.find((s) => s.id === activeSection.id)?.unlocked}
              >
                {saving ? 'Saving…' : 'Save & continue'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TrackResultView({ slug, attemptId }: { slug: string; attemptId: string }) {
  const { getToken, isSignedIn } = useAuth();
  const [state, setState] = useState<AttemptState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) return;
    getToken().then(async (token) => {
      if (!token) return;
      const data = await apiFetch<AttemptState>(`/problem-tracks/attempts/${attemptId}`, {
        token,
      });
      setState(data);
      setLoading(false);
    });
  }, [attemptId, getToken, isSignedIn]);

  if (loading) return <Skeleton height={300} />;
  if (!state?.result) return <Alert variant="error">Results not available yet.</Alert>;

  const { result } = state;

  return (
    <div className="track-result">
      <header className="track-result-header">
        <div className="track-result-score-block">
          <p className="track-result-score-value">{Number(result.rubricScore).toFixed(0)}%</p>
          <Badge className="track-result-band">{result.awardBandLabel}</Badge>
        </div>
        <h1>{state.track.title}</h1>
        <Card className="track-result-faralins-card">
          <p className="track-result-faralins-label">Faralins earned</p>
          <p className="track-result-faralins">{result.faralinsEarned.toLocaleString()}</p>
        </Card>
        <p className="text-muted track-result-meta">
          Trust: {SUBMISSION_TRUST_LABELS[result.trustLevel as keyof typeof SUBMISSION_TRUST_LABELS]}{' '}
          · {result.moderationStatus.replace(/_/g, ' ').toLowerCase()}
        </p>
      </header>

      <Card>
        <h2>Rubric breakdown</h2>
        <div className="track-rubric-bars">
          {result.rubricBreakdown?.map((item) => (
            <div key={item.name} className="track-rubric-bar-row">
              <div className="track-rubric-bar-head">
                <span className="track-rubric-bar-name">{item.name}</span>
                <span className="track-rubric-bar-score">{item.score}%</span>
              </div>
              <div className="track-rubric-bar" aria-hidden="true">
                <div className="track-rubric-bar-fill" style={{ width: `${item.score}%` }} />
              </div>
              <p className="track-rubric-bar-feedback text-muted">{item.feedback}</p>
            </div>
          ))}
        </div>
      </Card>

      {result.feedbackSummary?.strengths?.length ? (
        <Card>
          <h2>Strengths</h2>
          <ul>
            {result.feedbackSummary.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {result.feedbackSummary?.improvements?.length ? (
        <Card>
          <h2>Improve next time</h2>
          <ul>
            {result.feedbackSummary.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="track-result-actions">
        <Link href="/dashboard#completed-tracks">
          <Button>Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export function TrackHero({
  track,
}: {
  track: {
    slug: string;
    title: string;
    subtitle: string | null;
    difficultyBand: keyof typeof TRACK_DIFFICULTY_LABELS;
    maxFaralins: number;
    bursaryValueApproxGbp: number;
    estimatedHoursMin: number;
    estimatedHoursMax: number;
    timeCapHours: number;
    yearLevels: string[];
    partnerUniversityCategories: string[];
    skills: string[];
    subject: { name: string; slug: string };
    sectionOutline?: Array<{ id: string; type: string; title: string }>;
  };
}) {
  const sectionOutline = track.sectionOutline ?? [];

  return (
    <div className="track-hero-split">
      <div className="track-hero-visual">
        <MediaImage
          src={getSubjectImage(track.subject.slug)}
          alt={track.title}
          aspect="16x9"
          frameClassName="media-frame--fill track-hero-visual-frame"
          fallbackSrc={getAssessmentImageFallback(track.subject.slug)}
        />
        <div className="track-hero-visual-scrim" aria-hidden="true" />
      </div>

      <div className="track-hero-content">
        <Badge>{TRACK_DIFFICULTY_LABELS[track.difficultyBand]}</Badge>
        <h1 className="track-hero-title">{track.title}</h1>
        {track.subtitle ? <p className="track-hero-subtitle">{track.subtitle}</p> : null}

        <div className="track-hero-tags">
          <Badge>{track.subject.name}</Badge>
          {track.skills.slice(0, 4).map((s) => (
            <Badge key={s} variant="default">
              {s}
            </Badge>
          ))}
        </div>

        <div className="track-hero-stat-grid">
          <div className="track-stat-card">
            <span className="track-stat-card__value">{Math.round(track.timeCapHours / 24)} days</span>
            <span className="track-stat-card__label">Time cap</span>
          </div>
          <div className="track-stat-card">
            <span className="track-stat-card__value">
              {track.estimatedHoursMin}–{track.estimatedHoursMax}h
            </span>
            <span className="track-stat-card__label">Estimated effort</span>
          </div>
          <div className="track-stat-card">
            <span className="track-stat-card__value">{track.maxFaralins.toLocaleString()}</span>
            <span className="track-stat-card__label">Max Faralins</span>
          </div>
          <div className="track-stat-card">
            <span className="track-stat-card__value">£{track.bursaryValueApproxGbp}</span>
            <span className="track-stat-card__label">Est. bursary</span>
          </div>
          <div className="track-stat-card track-stat-card--wide">
            <span className="track-stat-card__value">{track.yearLevels.join(', ')}</span>
            <span className="track-stat-card__label">Best for</span>
          </div>
        </div>

        {track.partnerUniversityCategories.length ? (
          <p className="track-hero-partners text-muted">
            Partner recognition: {track.partnerUniversityCategories.join(', ')}
          </p>
        ) : null}

        {sectionOutline.length ? (
          <ol className="track-hero-outline">
            {sectionOutline.map((section, index) => (
              <li key={section.id}>
                <span className="track-hero-outline-num">{index + 1}</span>
                <span className="track-hero-outline-title">{section.title}</span>
              </li>
            ))}
          </ol>
        ) : null}

        <Link href={`/tracks/${track.slug}/attempt`}>
          <Button lg>Start Problem Track</Button>
        </Link>
      </div>
    </div>
  );
}
