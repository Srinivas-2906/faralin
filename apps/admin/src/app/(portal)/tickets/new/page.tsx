'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { TICKET_CHANNEL_LABELS, TICKET_PRIORITY_LABELS } from '@faralin/types';
import { Alert, Button, Card, Modal, PageHeader, Tabs } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminContext } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

interface Category {
  id: string;
  name: string;
}

interface StudentResult {
  id: string;
  anonymousId: string;
  firstName: string | null;
  lastName: string | null;
  user: { email: string };
}

export default function NewTicketPage() {
  const { accessDenied: contextDenied } = useAdminContext();
  const { adminFetch, accessDenied } = useAdminApi();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('case');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM',
    channel: 'INTERNAL',
    requesterName: '',
    requesterEmail: '',
    requesterPhone: '',
    studentProfileId: '',
  });

  useEffect(() => {
    adminFetch<Category[]>('/support/categories').then((rows) => {
      if (rows) {
        setCategories(rows);
        if (rows[0]) {
          setForm((current) => ({ ...current, categoryId: current.categoryId || rows[0].id }));
        }
      }
      setLoading(false);
    });
  }, [adminFetch]);

  useEffect(() => {
    if (studentQuery.trim().length < 2) {
      setStudentResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const rows = await adminFetch<StudentResult[]>(
        `/support/students/search?q=${encodeURIComponent(studentQuery.trim())}`,
      );
      if (rows) setStudentResults(rows);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [adminFetch, studentQuery]);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError('');
      try {
        const ticket = await adminFetch<{ id: string }>('/support/tickets', {
          method: 'POST',
          body: JSON.stringify({
            ...form,
            studentProfileId: form.studentProfileId || undefined,
            requesterEmail: form.requesterEmail || undefined,
            requesterPhone: form.requesterPhone || undefined,
          }),
        });
        if (ticket) {
          window.location.href = `/tickets/${ticket.id}`;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create ticket');
      } finally {
        setSubmitting(false);
      }
    },
    [adminFetch, form],
  );

  if (contextDenied || accessDenied) return <AccessDenied />;
  if (loading) return <AdminPageSkeleton rows={8} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Log new case"
          description="Create an internal support ticket from phone, email, or chat intake"
          actions={
            <Link href="/tickets" className="btn btn-secondary">
              Back to tickets
            </Link>
          }
        />

        <Card>
          {error ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{error}</Alert>
            </div>
          ) : null}

          <div className="page-toolbar">
            <Tabs
              ariaLabel="New ticket sections"
              activeId={tab}
              onChange={setTab}
              tabs={[
                { id: 'case', label: 'Case details' },
                { id: 'requester', label: 'Requester' },
              ]}
            />
          </div>

          <form className="form-stack" onSubmit={submit}>
            {tab === 'case' ? (
              <>
                <div className="form-row">
                  <label htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    required
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-row">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      required
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <label htmlFor="channel">Channel</label>
                    <select
                      id="channel"
                      value={form.channel}
                      onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    >
                      {Object.entries(TICKET_CHANNEL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            {tab === 'requester' ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="form-row">
                    <label htmlFor="requesterName">Name</label>
                    <input
                      id="requesterName"
                      required
                      value={form.requesterName}
                      onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="requesterEmail">Email</label>
                    <input
                      id="requesterEmail"
                      type="email"
                      value={form.requesterEmail}
                      onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="requesterPhone">Phone</label>
                    <input
                      id="requesterPhone"
                      value={form.requesterPhone}
                      onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label>Linked student</label>
                  <p style={{ margin: '0 0 0.5rem', color: 'var(--faralin-muted)', fontSize: '0.875rem' }}>
                    {form.studentProfileId
                      ? studentQuery || 'Student linked'
                      : 'No student linked'}
                  </p>
                  <Button type="button" variant="secondary" onClick={() => setStudentModalOpen(true)}>
                    {form.studentProfileId ? 'Change student' : 'Link student'}
                  </Button>
                </div>
              </>
            ) : null}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create ticket'}
            </button>
          </form>
        </Card>

        <Modal
          open={studentModalOpen}
          onClose={() => setStudentModalOpen(false)}
          title="Link student"
        >
          <div className="form-row">
            <label htmlFor="studentSearch">Search by email or anonymous ID</label>
            <input
              id="studentSearch"
              placeholder="Start typing…"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
          </div>
          {studentResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
              {studentResults.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => {
                    setForm({
                      ...form,
                      studentProfileId: student.id,
                      requesterName:
                        [student.firstName, student.lastName].filter(Boolean).join(' ') ||
                        student.anonymousId,
                      requesterEmail: student.user.email,
                    });
                    setStudentQuery(`${student.anonymousId} — ${student.user.email}`);
                    setStudentResults([]);
                    setStudentModalOpen(false);
                  }}
                >
                  {student.anonymousId} · {student.user.email}
                </button>
              ))}
            </div>
          ) : studentQuery.trim().length >= 2 ? (
            <p style={{ color: 'var(--faralin-muted)', marginTop: '0.75rem' }}>No students found.</p>
          ) : null}
        </Modal>
      </div>
    </div>
  );
}
