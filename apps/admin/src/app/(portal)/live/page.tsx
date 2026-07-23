'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { SUPPORT_REQUESTER_TYPE_LABELS } from '@faralin/types';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminContext } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

interface LiveTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  conversationPhase: string;
  requesterType: keyof typeof SUPPORT_REQUESTER_TYPE_LABELS;
  requesterName: string;
  streamChannelId: string | null;
  university: { name: string } | null;
  studentProfile: { anonymousId: string } | null;
  assignee: { email: string; supportAgentProfile: { displayName: string | null } | null } | null;
}

export default function LiveInboxPage() {
  const { accessDenied: contextDenied } = useAdminContext();
  const { adminFetch, accessDenied } = useAdminApi();
  const [tickets, setTickets] = useState<LiveTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<LiveTicket[]>('/support/live');
      if (data) setTickets(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load live inbox');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (contextDenied || accessDenied) return <AccessDenied />;
  if (loading && tickets.length === 0) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Live inbox" description="Waiting and active Stream conversations" />

        {error ? (
          <Card>
            <PageHeader title="Live inbox" description={error} />
          </Card>
        ) : tickets.length === 0 ? (
          <Card>
            <EmptyState message="No live conversations waiting." />
          </Card>
        ) : (
          <Card>
            <ResponsiveTable
              columns={[
                {
                  key: 'ticket',
                  header: 'Ticket',
                  render: (t) => (
                    <Link href={`/live/${t.id}`} style={{ fontWeight: 600 }}>
                      {t.ticketNumber}
                    </Link>
                  ),
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (t) => (
                    <Badge variant={t.requesterType === 'STUDENT' ? 'verified' : 'copper'}>
                      {SUPPORT_REQUESTER_TYPE_LABELS[t.requesterType]}
                    </Badge>
                  ),
                },
                { key: 'requester', header: 'Requester', render: (t) => t.requesterName },
                {
                  key: 'context',
                  header: 'Context',
                  render: (t) =>
                    t.university?.name ??
                    t.studentProfile?.anonymousId ??
                    '—',
                },
                { key: 'phase', header: 'Phase', render: (t) => t.conversationPhase.replaceAll('_', ' ') },
                {
                  key: 'assignee',
                  header: 'Agent',
                  render: (t) =>
                    t.assignee?.supportAgentProfile?.displayName ?? t.assignee?.email ?? 'Unassigned',
                },
              ]}
              data={tickets}
              getRowKey={(t) => t.id}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
