'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DIFFICULTY_LABELS } from '@faralin/types';
import { apiFetch } from '@faralin/utils';
import {
  Alert,
  Badge,
  Button,
  Card,
  Skeleton,
} from '@faralin/ui';
import { TRUST_LEVEL_SHORT_LABELS, trustBadgeVariant } from '@/components/assessment-card';

const QUESTION_TIME_SECONDS = 30;
const RING_RADIUS = 18;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface Question {
  id: string;
  sortOrder: number;
  prompt: string;
  questionType: string;
  options: string[] | null;
  points: number;
}

interface Assessment {
  slug: string;
  title: string;
  description: string | null;
  estimatedFaralinMin: number;
  estimatedFaralinMax: number;
  trustLevel: 'PRACTICE' | 'VERIFIED' | 'PARTNER_VERIFIED';
  difficulty: keyof typeof DIFFICULTY_LABELS;
  durationMinutes: number | null;
  isTimed: boolean;
  questions: Question[];
  subject?: { name: string; slug: string };
}

function formatCountdown(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AssessmentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'preview' | 'active' | 'done'>('preview');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SECONDS);
  const [result, setResult] = useState<{
    accuracyPercent: number;
    score: number;
    maxScore: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const advancingRef = useRef(false);
  const assessmentRef = useRef(assessment);
  const currentQuestionRef = useRef(currentQuestion);
  const submitAssessmentRef = useRef<() => Promise<void>>(async () => {});

  assessmentRef.current = assessment;
  currentQuestionRef.current = currentQuestion;

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/assessments/${slug}`)
      .then((r) => r.json())
      .then(setAssessment)
      .catch(() => setError('Failed to load assessment'))
      .finally(() => setLoading(false));
  }, [slug]);

  const submitAssessment = useCallback(async () => {
    if (!attemptId || !assessment || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const token = await getToken();
      const completed = await apiFetch<{
        accuracyPercent: number;
        score: number;
        maxScore: number;
      }>(`/assessments/attempts/${attemptId}/submit`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          answers: assessment.questions.map((q) => ({
            questionId: q.id,
            response: answers[q.id] ?? '',
            writtenExplanation: explanations[q.id],
          })),
        }),
      });
      setResult({
        accuracyPercent: Number(completed.accuracyPercent),
        score: Number(completed.score),
        maxScore: Number(completed.maxScore),
      });
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
      advancingRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, assessment, answers, explanations, getToken, submitting]);

  submitAssessmentRef.current = submitAssessment;

  async function startAssessment() {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    try {
      const token = await getToken();
      const attempt = await apiFetch<{ id: string }>(`/assessments/${slug}/start`, {
        method: 'POST',
        token: token ?? undefined,
      });
      setAttemptId(attempt.id);
      setPhase('active');
      setCurrentQuestion(0);
      setSecondsLeft(QUESTION_TIME_SECONDS);
      advancingRef.current = false;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    }
  }

  function goNext() {
    if (advancingRef.current || !assessment) return;
    if (currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion((i) => i + 1);
    }
  }

  function goPrev() {
    if (advancingRef.current || currentQuestion <= 0) return;
    setCurrentQuestion((i) => i - 1);
  }

  useEffect(() => {
    if (phase !== 'active') return;

    setSecondsLeft(QUESTION_TIME_SECONDS);
    advancingRef.current = false;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          if (advancingRef.current) return 0;
          advancingRef.current = true;

          const a = assessmentRef.current;
          const idx = currentQuestionRef.current;
          if (a && idx >= a.questions.length - 1) {
            void submitAssessmentRef.current();
          } else {
            setCurrentQuestion((i) => i + 1);
            advancingRef.current = false;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase, currentQuestion]);

  if (loading) {
    return (
      <div className="page-section">
        <div className="container-narrow">
          <Skeleton variant="text" width="30%" height="0.75rem" style={{ marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <Skeleton variant="text" width="5.5rem" height="1.5rem" />
            <Skeleton variant="text" width="4.5rem" height="1.5rem" />
          </div>
          <Skeleton variant="title" width="85%" style={{ marginBottom: '1rem' }} />
          <Skeleton variant="text" width="100%" style={{ marginBottom: '0.5rem' }} />
          <Skeleton variant="text" width="92%" style={{ marginBottom: '0.75rem' }} />
          <Skeleton variant="text" width="70%" height="0.875rem" style={{ marginBottom: '1.5rem' }} />
          <Skeleton variant="block" height="2.75rem" />
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="page-section">
        <div className="container-narrow">
          <Alert>{error || 'Assessment not found.'}</Alert>
        </div>
      </div>
    );
  }

  const q = assessment.questions[currentQuestion];
  const isLastQuestion = currentQuestion === assessment.questions.length - 1;
  const timerUrgent = secondsLeft <= 5;
  const ringDashoffset = RING_CIRCUMFERENCE * (1 - secondsLeft / QUESTION_TIME_SECONDS);

  return (
    <div className="page-section">
      <div className="container-narrow">
        {phase === 'preview' && (
          <Card className="assessment-preview">
            <header className="assessment-preview-hero">
              <p className="assessment-preview-eyebrow">
                {assessment.subject?.name ?? 'Assessment'}
              </p>
              <div className="assessment-preview-badges">
                <Badge>{DIFFICULTY_LABELS[assessment.difficulty]}</Badge>
                <Badge variant={trustBadgeVariant(assessment.trustLevel)}>
                  {TRUST_LEVEL_SHORT_LABELS[assessment.trustLevel]}
                </Badge>
              </div>
              <h1 className="display-title assessment-preview-title">{assessment.title}</h1>
              {assessment.description && (
                <p className="assessment-preview-lead">{assessment.description}</p>
              )}
              <p className="assessment-preview-facts">
                {assessment.questions.length} questions
                <> · </>
                <span className="text-copper">
                  {assessment.estimatedFaralinMin}–{assessment.estimatedFaralinMax} Faralins
                </span>
              </p>
            </header>

            <p className="disclaimer assessment-preview-timing">
              Each question allows {QUESTION_TIME_SECONDS} seconds. Unanswered questions are skipped
              automatically.
            </p>

            <p className="disclaimer assessment-preview-disclaimer">
              Faralins are conditional recognition value, not cash today.
            </p>

            {error && <Alert className="assessment-preview-alert">{error}</Alert>}

            <Button block onClick={startAssessment}>
              Begin assessment
            </Button>
          </Card>
        )}

        {phase === 'active' && q && (
          <div className="assessment-active">
            <div className="assessment-active-header">
              <div className="assessment-active-meta">
                <p className="assessment-active-title">{assessment.title}</p>
                <p className="assessment-active-progress">
                  Question {currentQuestion + 1} of {assessment.questions.length}
                </p>
              </div>
              <div
                className={`assessment-timer-ring${timerUrgent ? ' assessment-timer-ring--urgent' : ''}`}
                aria-live="polite"
                aria-label={`${secondsLeft} seconds remaining`}
              >
                <svg className="assessment-timer-ring-svg" viewBox="0 0 44 44" aria-hidden="true">
                  <circle className="assessment-timer-ring-track" cx="22" cy="22" r={RING_RADIUS} />
                  <circle
                    className="assessment-timer-ring-progress"
                    cx="22"
                    cy="22"
                    r={RING_RADIUS}
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringDashoffset}
                  />
                </svg>
                <span className="assessment-timer-ring-value">{formatCountdown(secondsLeft)}</span>
              </div>
            </div>

            <div key={currentQuestion} className="assessment-question-card">
              <Card>
                <p className="feed-item-meta">Question {currentQuestion + 1}</p>
                <p className="assessment-question-prompt">{q.prompt}</p>

                <div className="assessment-question-body">
                  {q.questionType === 'MCQ' && q.options ? (
                    <div className="stack-sm">
                      {q.options.map((opt) => (
                        <label
                          key={opt}
                          className={`selection-card${answers[q.id] === opt ? ' selected' : ''}`}
                        >
                          <input
                            type="radio"
                            className="assessment-question-radio"
                            name={q.id}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="assessment-question-input"
                        value={answers[q.id] ?? ''}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Your answer"
                      />
                      {assessment.trustLevel !== 'PRACTICE' && (
                        <textarea
                          className="assessment-question-textarea"
                          value={explanations[q.id] ?? ''}
                          onChange={(e) =>
                            setExplanations((prev) => ({ ...prev, [q.id]: e.target.value }))
                          }
                          placeholder="Explain your reasoning (for verified recognition)"
                        />
                      )}
                    </>
                  )}
                </div>
              </Card>
            </div>

            {error && <Alert>{error}</Alert>}

            <div className="assessment-sticky-footer">
              <div className="container-narrow assessment-sticky-footer-inner">
                <div className="assessment-nav-buttons">
                  <Button variant="secondary" onClick={goPrev} disabled={currentQuestion === 0}>
                    Previous
                  </Button>
                  {!isLastQuestion ? (
                    <Button onClick={goNext}>Next</Button>
                  ) : (
                    <Button loading={submitting} onClick={submitAssessment}>
                      Submit assessment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && result && (
          <Card className="result-panel result-panel-success">
            <h1 className="display-title result-panel-title">Assessment complete</h1>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              Your recognition has been recorded across your selected universities.
            </p>
            <div className="stat-value copper" style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>
              {result.accuracyPercent.toFixed(0)}%
            </div>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
              {result.score} / {result.maxScore} points
            </p>
            <div className="cluster" style={{ justifyContent: 'center' }}>
              <Link href="/dashboard" className="btn btn-primary">
                View dashboard
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
