'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  TICKET_CHANNEL_LABELS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@faralin/types';
import { Alert, Badge, Card, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminContext } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';
import {
  assigneeLabel,
  formatDateTime,
  isSlaOverdue,
  priorityBadgeVariant,
  statusBadgeVariant,
  ticketChannelLabel,
  ticketPriorityLabel,
  ticketStatusLabel,
} from '@/lib/ticket-utils';

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  channel: string;
  dueAt: string | null;
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  assigneeId: string | null;
  category: { id: string; name: string };
  assignee: {
    id: string;
    email: string;
    supportAgentProfile: { displayName: string | null } | null;
  } | null;
  studentProfile: {
    anonymousId: string;
    user: { email: string };
  } | null;
  messages: Array<{
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    author: {
      email: string;
      supportAgentProfile: { displayName: string | null } | null;
    };
  }>;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    metadata: Record<string, unknown> | null;
    actor: { email: string } | null;
  }>;
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { context, accessDenied: contextDenied } = useAdminContext();
  const { adminFetch, accessDenied } = useAdminApi();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminFetch<TicketDetail>(`/support/tickets/${params.id}`);
      if (data) setTicket(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const updateTicket = useCallback(
    async (body: Record<string, unknown>) => {
      setActionError('');
      try {
        await adminFetch(`/support/tickets/${params.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Update failed');
      }
    },
    [adminFetch, load, params.id],
  );

  const submitMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim()) return;
      setActionError('');
      try {
        await adminFetch(`/support/tickets/${params.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: message.trim(), isInternal }),
        });
        setMessage('');
        await load();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Failed to add message');
      }
    },
    [adminFetch, isInternal, load, message, params.id],
  );

  if (contextDenied || accessDenied) return <AccessDenied />;
  if (loading && !ticket) return <AdminPageSkeleton rows={8} />;

  if (error || !ticket) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader title="Ticket" description={error || 'Ticket not found'} />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title={ticket.ticketNumber}
          description={ticket.subject}
          actions={
            <Link href="/tickets" className="btn btn-secondary">
              Back to tickets
            </Link>
          }
        />

        {actionError ? (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{actionError}</Alert>
          </div>
        ) : null}

        <div className="layout-two-col" style={{ marginBottom: 'var(--section-gap)' }}>
          <Card>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <Badge variant={statusBadgeVariant(ticket.status)}>
                {ticketStatusLabel(ticket.status as never)}
              </Badge>
              <Badge variant={priorityBadgeVariant(ticket.priority)}>
                {ticketPriorityLabel(ticket.priority as never)}
              </Badge>
              <Badge>{ticket.category.name}</Badge>
              <Badge>{ticketChannelLabel(ticket.channel as never)}</Badge>
            </div>

            <p style={{ whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>{ticket.description}</p>

            <h3 className="section-title">Requester</h3>
            <p>{ticket.requesterName}</p>
            {ticket.requesterEmail ? <p>{ticket.requesterEmail}</p> : null}
            {ticket.requesterPhone ? <p>{ticket.requesterPhone}</p> : null}
            {ticket.studentProfile ? (
              <p style={{ color: 'var(--faralin-muted)' }}>
                Linked student: {ticket.studentProfile.anonymousId} ({ticket.studentProfile.user.email})
              </p>
            ) : null}

            <h3 className="section-title" style={{ marginTop: '1.5rem' }}>
              Assignment
            </h3>
            <p>{assigneeLabel(ticket.assignee)}</p>
            <p style={{ color: isSlaOverdue(ticket.dueAt) ? '#b91c1c' : 'var(--faralin-muted)' }}>
              Due: {formatDateTime(ticket.dueAt)}
            </p>

            <div className="admin-page-actions" style={{ marginTop: '1rem' }}>
              {!ticket.assigneeId ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => updateTicket({ assigneeId: context?.user.id })}
                >
                  Assign to me
                </button>
              ) : null}
              <select
                className="admin-status-select"
                value={ticket.status}
                onChange={(e) => updateTicket({ status: e.target.value })}
              >
                {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="admin-status-select"
                value={ticket.priority}
                onChange={(e) => updateTicket({ priority: e.target.value })}
              >
                {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            <h3 className="section-title">Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ticket.events.map((event) => (
                <div key={event.id} style={{ fontSize: '0.875rem' }}>
                  <strong>{event.eventType.replaceAll('_', ' ')}</strong>
                  <div style={{ color: 'var(--faralin-muted)' }}>
                    {formatDateTime(event.createdAt)}
                    {event.actor ? ` · ${event.actor.email}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <h3 className="section-title">Conversation</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {ticket.messages.length === 0 ? (
              <p style={{ color: 'var(--faralin-muted)' }}>No messages yet.</p>
            ) : (
              ticket.messages.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '0.875rem',
                    borderRadius: '8px',
                    background: entry.isInternal ? 'rgba(184,115,51,0.08)' : '#fff',
                    border: '1px solid rgba(15,23,42,0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <strong>
                      {entry.author.supportAgentProfile?.displayName ?? entry.author.email}
                    </strong>
                    <span style={{ color: 'var(--faralin-muted)', fontSize: '0.8125rem' }}>
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                  {entry.isInternal ? (
                    <Badge variant="copper" className="admin-status-active">
                      Internal note
                    </Badge>
                  ) : null}
                  <p style={{ whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>{entry.body}</p>
                </div>
              ))
            )}
          </div>

          <form className="form-stack" onSubmit={submitMessage}>
            <div className="form-row">
              <label htmlFor="message">Add reply or note</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Log what was communicated or an internal note"
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal note only
            </label>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Post message
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
