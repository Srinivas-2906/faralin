'use client';

import { useEffect, useState } from 'react';
import { Badge, Card, EmptyState, PageHeader, ResponsiveTable, Skeleton } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

interface StudentRow {
  anonymousId: string;
  revealLevel: string;
  subjectSlugs: string[];
  assessmentsCompleted: number;
  totalFaralins: number;
  performanceBand: string;
  firstName?: string;
  lastName?: string;
  schoolName?: string;
  yearGroup?: number;
}

export default function StudentsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [universityName, setUniversityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await staffFetch<{ university: { name: string }; students: StudentRow[] }>(
          '/universities/staff/dashboard',
        );
        if (data) {
          setUniversityName(data.university.name);
          setStudents(data.students ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load students');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [staffFetch]);

  if (accessDenied) return <AccessDenied />;
  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <Skeleton variant="title" width="30%" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Students"
          description={`Anonymous student roster for ${universityName || 'your university'}. Personal details appear only when a student has raised their reveal level.`}
        />

        <Card>
          {error ? (
            <EmptyState compact message={error} />
          ) : students.length === 0 ? (
            <EmptyState compact message="No students with activity yet." />
          ) : (
            <ResponsiveTable<StudentRow>
              columns={[
                { key: 'id', header: 'Anonymous ID', render: (s) => s.anonymousId },
                {
                  key: 'name',
                  header: 'Display',
                  render: (s) =>
                    s.firstName || s.lastName
                      ? [s.firstName, s.lastName].filter(Boolean).join(' ')
                      : '—',
                },
                {
                  key: 'subjects',
                  header: 'Subjects',
                  render: (s) => s.subjectSlugs.join(', ') || '—',
                },
                {
                  key: 'school',
                  header: 'School / year',
                  render: (s) =>
                    [s.schoolName, s.yearGroup ? `Year ${s.yearGroup}` : null]
                      .filter(Boolean)
                      .join(' · ') || '—',
                },
                {
                  key: 'assessments',
                  header: 'Assessments',
                  render: (s) => s.assessmentsCompleted,
                },
                {
                  key: 'faralins',
                  header: 'Faralins',
                  render: (s) => s.totalFaralins.toLocaleString(),
                },
                {
                  key: 'band',
                  header: 'Band',
                  render: (s) => <Badge>{s.performanceBand}</Badge>,
                },
                {
                  key: 'reveal',
                  header: 'Reveal',
                  render: (s) => s.revealLevel,
                },
              ]}
              data={students}
              getRowKey={(s) => s.anonymousId}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
