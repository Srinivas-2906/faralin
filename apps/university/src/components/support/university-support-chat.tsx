'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Alert, Card, EmptyState, PageHeader, ResponsiveTable, Tabs } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { useStaffApi } from '@/lib/use-staff-api';

const SupportLiveChat = dynamic(
  () => import('@/components/support/support-live-chat').then((m) => m.SupportLiveChat),
  { ssr: false },
);

interface BotTurn {
  id: string;
  role: 'USER' | 'BOT';
  body: string;
}

interface Session {
  ticketId: string;
  ticketNumber: string;
  conversationPhase: string;
  streamChannelId: string | null;
  suggestEscalation: boolean;
  botTurns: BotTurn[];
}

export function UniversitySupportChat() {
  const { staffFetch, accessDenied } = useStaffApi();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [tab, setTab] = useState('chat');
  const [ticketPage, setTicketPage] = useState(1);
  const ticketPageSize = 15;
  const [uniTickets, setUniTickets] = useState<
    Array<{ id: string; ticketNumber: string; subject: string; conversationPhase: string; requesterName: string }>
  >([]);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await staffFetch<Session>('/support/bot/session');
      if (data) setSession(data);
      const tickets = await staffFetch<typeof uniTickets>('/universities/staff/support/tickets');
      if (tickets) setUniTickets(tickets);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load support');
    } finally {
      setLoading(false);
    }
  }, [staffFetch]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setSending(true);
    try {
      await staffFetch('/support/bot/message', {
        method: 'POST',
        body: JSON.stringify({ ticketId: session.ticketId, message: message.trim() }),
      });
      setMessage('');
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  async function escalate() {
    if (!session) return;
    setEscalating(true);
    try {
      const result = await staffFetch<{ streamChannelId: string; conversationPhase: string }>(
        '/support/bot/escalate',
        { method: 'POST', body: JSON.stringify({ ticketId: session.ticketId }) },
      );
      if (result) {
        setSession({
          ...session,
          streamChannelId: result.streamChannelId,
          conversationPhase: result.conversationPhase,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to agent');
    } finally {
      setEscalating(false);
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading && !session) return <Card><p>Loading support…</p></Card>;

  const showLiveChat =
    session?.streamChannelId &&
    (session.conversationPhase === 'WAITING_AGENT' || session.conversationPhase === 'AGENT');

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Support" description="Get help with the university portal and student pipeline" />

        {error ? (
          <div style={{ marginBottom: '1rem' }}>
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        <Card>
          <div className="page-toolbar">
            <Tabs
              ariaLabel="Support sections"
              activeId={tab}
              onChange={setTab}
              tabs={[
                { id: 'chat', label: 'Chat' },
                { id: 'history', label: 'Ticket history', count: uniTickets.length },
              ]}
            />
          </div>

          {tab === 'chat' && session ? (
            <>
            {!showLiveChat ? (
              <>
                <div className="scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: '360px' }}>
                  {session.botTurns.map((turn) => (
                    <div
                      key={turn.id}
                      style={{
                        alignSelf: turn.role === 'USER' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        background: turn.role === 'USER' ? 'rgba(184,115,51,0.15)' : 'rgba(15,23,42,0.06)',
                      }}
                    >
                      {turn.body}
                    </div>
                  ))}
                </div>
                <form onSubmit={sendMessage} className="form-stack">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your question…"
                    rows={3}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={sending}>
                      Send
                    </button>
                    <button type="button" className="btn btn-secondary" disabled={escalating} onClick={escalate}>
                      Talk to an agent
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <SupportLiveChat streamChannelId={session.streamChannelId!} />
            )}
            </>
          ) : null}

          {tab === 'history' ? (
            uniTickets.length === 0 ? (
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
                paginated
                page={ticketPage}
                pageSize={ticketPageSize}
                onPageChange={setTicketPage}
                maxHeight="480px"
              />
            )
          ) : null}
        </Card>

        <p style={{ marginTop: '1rem' }}>
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
