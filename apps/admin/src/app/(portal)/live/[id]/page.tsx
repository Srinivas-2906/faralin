'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Badge, Card, PageHeader } from '@faralin/ui';
import { SUPPORT_REQUESTER_TYPE_LABELS } from '@faralin/types';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminContext } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

const AdminLiveChat = dynamic(
  () => import('@/components/admin-live-chat').then((m) => m.AdminLiveChat),
  { ssr: false },
);

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
}

function requesterContext(ticket: LiveTicket) {
  if (ticket.university?.name) return ticket.university.name;
  if (ticket.studentProfile?.anonymousId) return `Student ${ticket.studentProfile.anonymousId}`;
  return null;
}

export default function LiveTicketPage() {
  const params = useParams<{ id: string }>();
  const { accessDenied: contextDenied } = useAdminContext();
  const { adminFetch, accessDenied } = useAdminApi();
  const [ticket, setTicket] = useState<LiveTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminFetch<LiveTicket[]>('/support/live');
      const match = rows?.find((row) => row.id === params.id) ?? null;
      setTicket(match);
      if (!match) setError('Conversation not found in live queue');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [adminFetch, params.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function joinConversation() {
    setJoining(true);
    try {
      const updated = await adminFetch<LiveTicket>(`/support/live/${params.id}/join`, {
        method: 'POST',
      });
      if (updated) setTicket(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join');
    } finally {
      setJoining(false);
    }
  }

  async function resolveConversation() {
    setResolving(true);
    try {
      await adminFetch(`/support/live/${params.id}/resolve`, { method: 'POST' });
      window.location.href = '/live';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to resolve');
      setResolving(false);
    }
  }

  if (contextDenied || accessDenied) return <AccessDenied />;
  if (loading) return <AdminPageSkeleton rows={8} />;

  if (error || !ticket?.streamChannelId) {
    return (
      <div className="page-section">
        <div className="container">
          <Card>
            <PageHeader title="Live chat" description={error || 'No Stream channel'} />
          </Card>
        </div>
      </div>
    );
  }

  const context = requesterContext(ticket);
  const isWaiting = ticket.conversationPhase === 'WAITING_AGENT';
  const isLive = ticket.conversationPhase === 'AGENT';

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader
          title={ticket.ticketNumber}
          description={ticket.subject}
          actions={
            <Link href="/live" className="btn btn-secondary">
              Back to inbox
            </Link>
          }
        />

        <Card className="live-chat-card">
          <div className="live-chat-toolbar">
            <div className="live-chat-toolbar-meta">
              <Badge variant={ticket.requesterType === 'STUDENT' ? 'verified' : 'copper'}>
                {SUPPORT_REQUESTER_TYPE_LABELS[ticket.requesterType]}
              </Badge>
              <span className="live-chat-toolbar-name">{ticket.requesterName}</span>
              {context ? <span className="live-chat-toolbar-context">{context}</span> : null}
              <span className="live-chat-toolbar-phase">
                {ticket.conversationPhase.replaceAll('_', ' ')}
              </span>
            </div>

            <div className="live-chat-toolbar-actions">
              {isWaiting ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={joining}
                  onClick={joinConversation}
                >
                  {joining ? 'Joining…' : 'Join conversation'}
                </button>
              ) : null}
              {isLive ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={resolving}
                  onClick={resolveConversation}
                >
                  {resolving ? 'Resolving…' : 'Mark resolved'}
                </button>
              ) : null}
            </div>
          </div>

          {isLive ? (
            <AdminLiveChat streamChannelId={ticket.streamChannelId} />
          ) : (
            <p className="live-chat-placeholder">
              {isWaiting
                ? 'Join the conversation to open the live chat window.'
                : 'This conversation is not active.'}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
