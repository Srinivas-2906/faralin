'use client';

import Link from 'next/link';
import { Badge, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';
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
  status: string;
  priority: string;
  dueAt: string | null;
  category: { name: string };
  assignee: {
    email: string;
    supportAgentProfile: { displayName: string | null } | null;
  } | null;
}

interface TicketListResponse {
  items: TicketRow[];
  total: number;
}

export default function TicketQueuePage() {
  const { data, loading, error, accessDenied } = useAdminData<TicketListResponse>(
    '/support/tickets?mine=true',
    30000,
  );

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={5} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="My queue"
          description={data ? `${data.total} tickets assigned to you` : 'Assigned tickets'}
        />

        {error ? (
          <Card>
            <PageHeader title="My queue" description={error} />
          </Card>
        ) : !data || data.items.length === 0 ? (
          <Card>
            <EmptyState message="No tickets assigned to you." />
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
                      {ticketStatusLabel(row.status as never)}
                    </Badge>
                  ),
                },
                {
                  key: 'priority',
                  header: 'Priority',
                  render: (row) => (
                    <Badge variant={priorityBadgeVariant(row.priority)}>
                      {ticketPriorityLabel(row.priority as never)}
                    </Badge>
                  ),
                },
                { key: 'category', header: 'Category', render: (row) => row.category.name },
                {
                  key: 'due',
                  header: 'Due',
                  render: (row) => (
                    <span style={{ color: isSlaOverdue(row.dueAt) ? '#b91c1c' : undefined }}>
                      {formatDateTime(row.dueAt)}
                    </span>
                  ),
                },
                {
                  key: 'assignee',
                  header: 'Assignee',
                  render: (row) => assigneeLabel(row.assignee),
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
