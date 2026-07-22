'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  PageHeader,
  ResponsiveTable,
  SkeletonTable,
} from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

const EVENT_TYPES = ['WEBINAR', 'OPEN_DAY', 'TASTER', 'CHALLENGE'];

interface EventRow {
  id: string;
  title: string;
  type: string;
  startsAt: string;
  isPublished: boolean;
  registrations?: unknown[];
}

export default function EventsPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'WEBINAR',
    title: '',
    description: '',
    startsAt: '',
    externalUrl: '',
    capacity: '',
    isPublished: false,
  });

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await staffFetch<EventRow[]>('/content/staff/events');
      if (data) setEvents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await staffFetch('/content/staff/events', {
        method: 'POST',
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          startsAt: new Date(form.startsAt).toISOString(),
          externalUrl: form.externalUrl || undefined,
          capacity: form.capacity ? Number(form.capacity) : undefined,
          isPublished: form.isPublished,
        }),
      });
      setShowForm(false);
      setForm({
        type: 'WEBINAR',
        title: '',
        description: '',
        startsAt: '',
        externalUrl: '',
        capacity: '',
        isPublished: false,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading) {
    return (
      <div className="page-section">
        <div className="container">
          <PageHeader title="Events" description="Schedule webinars, open days, and taster sessions." />
          <Card>
            <SkeletonTable rows={4} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Events"
          description="Schedule webinars, open days, and taster sessions."
          actions={
            <Button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancel' : 'New event'}
            </Button>
          }
        />

        {error && (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {showForm && (
          <Card style={{ marginBottom: 'var(--section-gap)' }}>
            <form className="form-stack" onSubmit={handleCreate}>
              <div className="form-row">
                <label htmlFor="event-type">Type</label>
                <select
                  id="event-type"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="event-title">Title</label>
                <input
                  id="event-title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="event-description">Description</label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="event-starts">Starts at</label>
                <input
                  id="event-starts"
                  type="datetime-local"
                  required
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="event-url">External URL</label>
                <input
                  id="event-url"
                  type="url"
                  value={form.externalUrl}
                  onChange={(e) => setForm((f) => ({ ...f, externalUrl: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label htmlFor="event-capacity">Capacity</label>
                <input
                  id="event-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                />
                Publish immediately
              </label>
              <Button type="submit">Create event</Button>
            </form>
          </Card>
        )}

        <Card>
          {events.length === 0 ? (
            <EmptyState
              compact
              message="No events yet. Publish to appear on faralin.kaana.in/universities/…"
            />
          ) : (
            <ResponsiveTable<EventRow>
              columns={[
                { key: 'title', header: 'Title', render: (e) => e.title },
                { key: 'type', header: 'Type', render: (e) => e.type },
                {
                  key: 'starts',
                  header: 'Starts',
                  render: (e) => new Date(e.startsAt).toLocaleString(),
                },
                {
                  key: 'published',
                  header: 'Published',
                  render: (e) => (e.isPublished ? 'Yes' : 'No'),
                },
                {
                  key: 'registrations',
                  header: 'Registrations',
                  render: (e) => e.registrations?.length ?? 0,
                },
              ]}
              data={events}
              getRowKey={(e) => e.id}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
