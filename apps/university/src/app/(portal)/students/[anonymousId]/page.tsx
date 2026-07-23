'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Badge, Button, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { PortalPageSkeleton } from '@/components/portal-page-skeleton';
import { usePortalData } from '@/components/portal-provider';

interface StudentDetailData {
  university: { name: string };
  student: {
    anonymousId: string;
    revealLevel: string;
    subjectSlugs: string[];
    subjectNames: string[];
    assessmentsCompleted: number;
    totalFaralins: number;
    performanceBand: string;
    applicationStatus: string;
    firstName?: string;
    lastName?: string;
    schoolName?: string;
    yearGroup?: number;
  };
  faralins: {
    totalFaralins: number;
    verifiedFaralins: number;
    estimatedBursaryGbp: number;
    faralinsPerGbp: number | null;
  };
  assessmentsCompleted: Array<{
    title: string;
    slug: string;
    subjectName: string;
    completedAt: string;
    accuracyPercent: number | null;
    faralinsEarned: number;
  }>;
  recentActivity: Array<{
    type: 'assessment' | 'faralin' | 'track' | 'event';
    label: string;
    occurredAt: string;
    detail?: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  FOLLOWER: 'Following',
  REFERRAL_CLICKED: 'Referral clicked',
  APPLIED: 'Applied',
  OFFER_RECEIVED: 'Offer received',
  OFFER_ACCEPTED: 'Offer accepted',
  ENROLLED: 'Enrolled',
  WITHDRAWN: 'Withdrawn',
  REJECTED: 'Rejected',
};

const ACTIVITY_LABELS: Record<StudentDetailData['recentActivity'][number]['type'], string> = {
  assessment: 'Assessment',
  faralin: 'Faralin',
  track: 'Problem track',
  event: 'Event',
};

function displayName(student: StudentDetailData['student']) {
  if (student.firstName || student.lastName) {
    return [student.firstName, student.lastName].filter(Boolean).join(' ');
  }
  return student.anonymousId;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function StudentDetailPage() {
  const params = useParams<{ anonymousId: string }>();
  const anonymousId = params.anonymousId;

  const { data, loading, error, accessDenied, refresh, lastUpdated } =
    usePortalData<StudentDetailData>(
      `/universities/staff/students/${encodeURIComponent(anonymousId)}`,
    );

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <PortalPageSkeleton rows={4} />;
  if (error || !data) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader
              title="Student profile"
              description={error || 'Unable to load student profile.'}
              actions={
                <Link href="/students" className="btn btn-secondary">
                  Back to roster
                </Link>
              }
            />
          </Card>
        </div>
      </div>
    );
  }

  const { university, student, faralins, assessmentsCompleted, recentActivity } = data;
  const conversionLabel = faralins.faralinsPerGbp
    ? `${faralins.faralinsPerGbp.toLocaleString()} Faralins ≈ £1`
    : '—';

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title={displayName(student)}
          description={`${university.name} · ${student.anonymousId}`}
          actions={
            <div className="portal-page-actions">
              {lastUpdated ? (
                <span className="portal-last-updated">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              ) : null}
              <Button type="button" variant="secondary" onClick={() => refresh()}>
                Refresh
              </Button>
              <Link href="/students" className="btn btn-secondary">
                Back to roster
              </Link>
            </div>
          }
        />

        <div className="portal-student-detail-grid">
          <Card className="portal-student-detail-summary">
            <h2 className="section-title">Summary</h2>
            <dl className="portal-detail-list">
              <div>
                <dt>Reveal level</dt>
                <dd>{student.revealLevel}</dd>
              </div>
              <div>
                <dt>Pipeline</dt>
                <dd>{STATUS_LABELS[student.applicationStatus] ?? student.applicationStatus}</dd>
              </div>
              <div>
                <dt>Performance band</dt>
                <dd>
                  <Badge>{student.performanceBand}</Badge>
                </dd>
              </div>
              <div>
                <dt>Subjects</dt>
                <dd>
                  {student.subjectNames.length > 0 ? student.subjectNames.join(', ') : '—'}
                </dd>
              </div>
              {student.schoolName ? (
                <div>
                  <dt>School</dt>
                  <dd>{student.schoolName}</dd>
                </div>
              ) : null}
              {student.yearGroup != null ? (
                <div>
                  <dt>Year group</dt>
                  <dd>{student.yearGroup}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="portal-student-detail-faralins">
            <h2 className="section-title">Faralins</h2>
            <div className="stat-grid portal-stat-grid portal-student-faralin-grid">
              <div className="portal-detail-stat">
                <span className="portal-detail-stat-label">Total Faralins</span>
                <strong>{faralins.totalFaralins.toLocaleString()}</strong>
              </div>
              <div className="portal-detail-stat">
                <span className="portal-detail-stat-label">Verified Faralins</span>
                <strong>{faralins.verifiedFaralins.toLocaleString()}</strong>
              </div>
              <div className="portal-detail-stat">
                <span className="portal-detail-stat-label">Est. bursary</span>
                <strong>£{faralins.estimatedBursaryGbp.toFixed(2)}</strong>
              </div>
              <div className="portal-detail-stat">
                <span className="portal-detail-stat-label">Conversion</span>
                <strong>{conversionLabel}</strong>
              </div>
            </div>
            <p className="portal-faralin-disclaimer">
              Verified Faralins exclude practice recognition and reflect conditional liability.
            </p>
          </Card>
        </div>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h2 className="section-title">Assessments completed</h2>
          {assessmentsCompleted.length === 0 ? (
            <EmptyState compact message="No completed assessments yet." />
          ) : (
            <ResponsiveTable
              columns={[
                {
                  key: 'assessment',
                  header: 'Assessment',
                  render: (row) => (
                    <div>
                      <div>{row.title}</div>
                      <div className="portal-table-meta">{row.subjectName}</div>
                    </div>
                  ),
                },
                {
                  key: 'completed',
                  header: 'Completed',
                  render: (row) => formatDate(row.completedAt),
                },
                {
                  key: 'score',
                  header: 'Score',
                  render: (row) =>
                    row.accuracyPercent != null ? `${row.accuracyPercent}%` : '—',
                },
                {
                  key: 'faralins',
                  header: 'Faralins earned',
                  render: (row) => row.faralinsEarned.toLocaleString(),
                },
              ]}
              data={assessmentsCompleted}
              getRowKey={(row) => `${row.slug}-${row.completedAt}`}
            />
          )}
        </Card>

        <Card>
          <h2 className="section-title">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <EmptyState compact message="No recent activity." />
          ) : (
            <ul className="portal-activity-timeline">
              {recentActivity.map((item, index) => (
                <li key={`${item.type}-${item.occurredAt}-${index}`}>
                  <div className="portal-activity-type">{ACTIVITY_LABELS[item.type]}</div>
                  <div className="portal-activity-body">
                    <strong>{item.label}</strong>
                    {item.detail ? (
                      <span className="portal-table-meta">{item.detail}</span>
                    ) : null}
                  </div>
                  <time className="portal-activity-time">{formatDate(item.occurredAt)}</time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
