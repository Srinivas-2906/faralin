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
  const [problemTracks, setProblemTracks] = useState<
    Array<{
      id: string;
      trackId: string;
      title: string;
      slug: string;
      isActive: boolean;
      maxFaralins: number;
      _count: { attempts: number };
    }>
  >([]);
  const [moderationQueue, setModerationQueue] = useState<
    Array<{
      id: string;
      rubricScore: number | string;
      faralinsEarned: number | null;
      trustLevel: string | null;
      problemTrack: { title: string };
      studentProfile: { anonymousId: string };
    }>
  >([]);
  const [error, setError] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUniversityId, setStaffUniversityId] = useState('');
  const [staffJobTitle, setStaffJobTitle] = useState('');
  const [staffMessage, setStaffMessage] = useState('');
  const [staffError, setStaffError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const [ov, ass, rl, uni, tracks, mod] = await Promise.all([
          apiFetch<Record<string, number>>('/admin/overview', { token: token ?? undefined }),
          apiFetch<typeof assessments>('/admin/assessments', { token: token ?? undefined }),
          apiFetch<typeof rules>('/admin/faralin-rules', { token: token ?? undefined }),
          apiFetch<typeof universities>('/admin/universities', { token: token ?? undefined }),
          apiFetch<typeof problemTracks>('/admin/problem-tracks', { token: token ?? undefined }),
          apiFetch<typeof moderationQueue>('/admin/problem-tracks/moderation', {
            token: token ?? undefined,
          }),
        ]);
        setOverview(ov);
        setAssessments(ass);
        setRules(rl);
        setUniversities(uni);
        setProblemTracks(tracks);
        setModerationQueue(mod);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Admin access required');
      }
    }
    load();
  }, [getToken]);

  async function inviteStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffError('');
    setStaffMessage('');
    try {
      const token = await getToken();
      await apiFetch('/admin/university-staff', {
        token: token ?? undefined,
        method: 'POST',
        body: JSON.stringify({
          email: staffEmail,
          universityId: staffUniversityId,
          jobTitle: staffJobTitle || undefined,
        }),
      });
      setStaffMessage(`Invited ${staffEmail}. Ask them to accept the Clerk invite, then sign in at the university portal.`);
      setStaffEmail('');
      setStaffJobTitle('');
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Failed to invite staff');
    }
  }

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

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Moderation queue ({moderationQueue.length})</h2>
          {moderationQueue.length === 0 ? (
            <EmptyState compact message="No submissions awaiting review." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'track', header: 'Track', render: (m) => m.problemTrack.title },
                { key: 'student', header: 'Student', render: (m) => m.studentProfile.anonymousId },
                { key: 'score', header: 'Score', render: (m) => `${m.rubricScore}%` },
                { key: 'faralins', header: 'Faralins', render: (m) => m.faralinsEarned ?? 0 },
                { key: 'trust', header: 'Trust', render: (m) => m.trustLevel ?? '—' },
              ]}
              data={moderationQueue}
              getRowKey={(m) => m.id}
            />
          )}
        </Card>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Problem Tracks ({problemTracks.length})</h2>
          {problemTracks.length === 0 ? (
            <EmptyState compact message="No problem tracks." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'trackId', header: 'ID', render: (t) => t.trackId },
                { key: 'title', header: 'Title', render: (t) => t.title },
                { key: 'max', header: 'Max Faralins', render: (t) => t.maxFaralins },
                { key: 'attempts', header: 'Attempts', render: (t) => t._count.attempts },
                { key: 'active', header: 'Active', render: (t) => (t.isActive ? 'Yes' : 'No') },
              ]}
              data={problemTracks}
              getRowKey={(t) => t.id}
            />
          )}
        </Card>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Invite university staff</h2>
          <p style={{ color: 'var(--faralin-muted)', marginBottom: '1rem' }}>
            Creates a pending staff account. Send a Clerk invite to the same email, then staff sign in at the university portal.
          </p>
          {staffError && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{staffError}</Alert>
            </div>
          )}
          {staffMessage && (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="success">{staffMessage}</Alert>
            </div>
          )}
          <form
            onSubmit={inviteStaff}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--faralin-muted)' }}>Email</span>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--faralin-muted)' }}>University</span>
              <select
                required
                value={staffUniversityId}
                onChange={(e) => setStaffUniversityId(e.target.value)}
              >
                <option value="">Select university</option>
                {universities.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--faralin-muted)' }}>Job title</span>
              <input
                value={staffJobTitle}
                onChange={(e) => setStaffJobTitle(e.target.value)}
                placeholder="Widening Participation Officer"
              />
            </label>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Create staff account
            </button>
          </form>
        </Card>

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
