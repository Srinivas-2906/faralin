'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

export default function UniversitySupportPage() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [uniTickets, setUniTickets] = useState<
    Array<{ id: string; ticketNumber: string; subject: string; conversationPhase: string; requesterName: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const tickets = await staffFetch<typeof uniTickets>('/universities/staff/support/tickets');
      if (tickets) setUniTickets(tickets);
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  if (accessDenied) return <AccessDenied />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title="Support"
          description="Get help with the university portal, student pipeline, and content publishing."
          actions={
            <Link href="/support/chat" className="btn btn-primary">
              Start a conversation
            </Link>
          }
        />

        <div className="portal-stack">
        <Card>
          <p style={{ color: 'var(--faralin-muted)', marginBottom: '1rem' }}>
            Ask our assistant for portal guidance, or talk to a Faralin support agent for complex issues.
          </p>
          <Link href="/support/chat" className="btn btn-secondary">
            Open support chat
          </Link>
        </Card>

        <Card>
          <h2 className="section-title">University support cases</h2>
          {loading ? (
            <p>Loading cases…</p>
          ) : uniTickets.length === 0 ? (
            <EmptyState compact message="No support cases for your university yet." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'num', header: 'Ticket', render: (t) => t.ticketNumber },
                { key: 'subject', header: 'Subject', render: (t) => t.subject },
                { key: 'requester', header: 'Requester', render: (t) => t.requesterName },
                { key: 'phase', header: 'Phase', render: (t) => t.conversationPhase },
              ]}
              data={uniTickets}
              getRowKey={(t) => t.id}
            />
          )}
        </Card>
        </div>

        <p style={{ marginTop: '1rem' }}>
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
