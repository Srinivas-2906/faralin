'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
} from '@faralin/types';
import { Badge, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
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
  ticketPriorityLabel,
  ticketStatusLabel,
} from '@/lib/ticket-utils';

interface TicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  status: keyof typeof TICKET_STATUS_LABELS;
  priority: keyof typeof TICKET_PRIORITY_LABELS;
  dueAt: string | null;
  createdAt: string;
  category: { name: string };
  assignee: {
    email: string;
    supportAgentProfile: { displayName: string | null } | null;
  } | null;
}

interface TicketListResponse {
  items: TicketRow[];
  total: number;
  page: number;
  totalPages: number;
}

export default function TicketsPage() {
  const { accessDenied: contextDenied } = useAdminContext();
  const { adminFetch, accessDenied } = useAdminApi();
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (search.trim()) params.set('search', search.trim());
      if (assigneeId) params.set('assigneeId', assigneeId);
      const query = params.toString();
      const result = await adminFetch<TicketListResponse>(
        `/support/tickets${query ? `?${query}` : ''}`,
      );
      if (result) setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, assigneeId, priority, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  if (contextDenied || accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="All tickets"
          description={data ? `${data.total} total cases` : 'Support cases'}
          actions={
            <Link href="/tickets/new" className="btn btn-primary">
              New ticket
            </Link>
          }
        />

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          <div className="admin-toolbar">
            <input
              className="admin-search"
              placeholder="Search ticket #, subject, requester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') load();
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="admin-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="admin-status-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">All priorities</option>
                {Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="admin-status-select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
              </select>
              <button type="button" className="btn btn-secondary" onClick={load}>
                Apply filters
              </button>
            </div>
          </div>
        </Card>

        {error ? (
          <Card>
            <PageHeader title="Tickets" description={error} />
          </Card>
        ) : !data || data.items.length === 0 ? (
          <Card>
            <EmptyState message="No tickets match your filters." />
          </Card>
        ) : (
          <Card>
            <ResponsiveTable
              columns={[
                {
                  key: 'number',
                  header: 'Ticket',
                  render: (row) => (
                    <Link href={`/tickets/${row.id}`} style={{ fontWeight: 600 }}>
                      {row.ticketNumber}
                    </Link>
                  ),
                },
                { key: 'subject', header: 'Subject', render: (row) => row.subject },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row) => (
                    <Badge variant={statusBadgeVariant(row.status)}>
                      {ticketStatusLabel(row.status)}
                    </Badge>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (row) => (
                    <Badge variant={priorityBadgeVariant(row.priority)}>
                      {ticketPriorityLabel(row.priority)}
                    </Badge>
                  ),
                },
                { key: 'category', header: 'Category', render: (row) => row.category.name },
                {
                  key: 'assignee',
                  header: 'Assignee',
                  render: (row) => assigneeLabel(row.assignee),
                },
                {
                  key: 'due',
                  header: 'Due',
                  render: (row) => (
                    <span style={{ color: isSlaOverdue(row.dueAt) ? '#b91c1c' : undefined }}>
                      {formatDateTime(row.dueAt)}
                    </span>
                  ),
                },
              ]}
              data={data.items}
              getRowKey={(row) => row.id}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
