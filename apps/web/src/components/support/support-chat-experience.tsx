'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Alert, Card, PageHeader } from '@faralin/ui';
import { useSupportApi } from '@/lib/use-support-api';

const SupportLiveChat = dynamic(
  () => import('@/components/support/support-live-chat').then((m) => m.SupportLiveChat),
  { ssr: false },
);

interface BotTurn {
  id: string;
  role: 'USER' | 'BOT';
  body: string;
  confidence: number | null;
  createdAt: string;
}

interface Session {
  ticketId: string;
  ticketNumber: string;
  conversationPhase: string;
  streamChannelId: string | null;
  suggestEscalation: boolean;
  botTurns: BotTurn[];
}

export function SupportChatExperience() {
  const { supportFetch } = useSupportApi();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [suggestEscalation, setSuggestEscalation] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await supportFetch<Session>('/support/bot/session');
      setSession(data);
      setSuggestEscalation(data.suggestEscalation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load support');
    } finally {
      setLoading(false);
    }
  }, [supportFetch]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const result = await supportFetch<{
        botMessage: string;
        suggestEscalation: boolean;
      }>('/support/bot/message', {
        method: 'POST',
        body: JSON.stringify({ ticketId: session.ticketId, message: message.trim() }),
      });
      setMessage('');
      setSuggestEscalation(result.suggestEscalation);
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
    setError('');
    try {
      const result = await supportFetch<{
        streamChannelId: string;
        conversationPhase: string;
      }>('/support/bot/escalate', {
        method: 'POST',
        body: JSON.stringify({ ticketId: session.ticketId }),
      });
      setSession({
        ...session,
        streamChannelId: result.streamChannelId,
        conversationPhase: result.conversationPhase,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to agent');
    } finally {
      setEscalating(false);
    }
  }

  if (loading) {
    return <Card><p>Loading help centre…</p></Card>;
  }

  if (error && !session) {
    return (
      <Card>
        <PageHeader title="Help centre" description={error} />
      </Card>
    );
  }

  if (!session) return null;

  const showLiveChat =
    session.streamChannelId &&
    (session.conversationPhase === 'WAITING_AGENT' || session.conversationPhase === 'AGENT');

  return (
    <div>
      {error ? (
        <div style={{ marginBottom: '1rem' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      <Card style={{ marginBottom: 'var(--section-gap)' }}>
        <PageHeader
          title="Faralin Help"
          description={`Ticket ${session.ticketNumber} · ${session.conversationPhase.replaceAll('_', ' ').toLowerCase()}`}
        />

        {!showLiveChat ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              {session.botTurns.length === 0 ? (
                <p style={{ color: 'var(--faralin-muted)' }}>
                  Ask a question about your account, assessments, Faralins, or applications.
                </p>
              ) : (
                session.botTurns.map((turn) => (
                  <div
                    key={turn.id}
                    style={{
                      alignSelf: turn.role === 'USER' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      background:
                        turn.role === 'USER'
                          ? 'rgba(184,115,51,0.15)'
                          : 'rgba(15,23,42,0.06)',
                    }}
                  >
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{turn.body}</p>
                  </div>
                ))
              )}
            </div>

            {suggestEscalation ? (
              <p style={{ color: 'var(--faralin-copper)', marginBottom: '1rem' }}>
                Need more help? You can talk to a support agent.
              </p>
            ) : null}

            <form onSubmit={sendMessage} className="form-stack">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question…"
                rows={3}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={escalating}
                  onClick={escalate}
                >
                  {escalating ? 'Connecting…' : 'Talk to an agent'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <SupportLiveChat streamChannelId={session.streamChannelId!} />
        )}
      </Card>

      <p style={{ color: 'var(--faralin-muted)', fontSize: '0.875rem' }}>
        <Link href="/dashboard">Back to dashboard</Link>
      </p>
    </div>
  );
}
