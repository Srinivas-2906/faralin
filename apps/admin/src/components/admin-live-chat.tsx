'use client';

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  Message,
  MessageComposer,
  MessageList,
  Window,
  type MessageUIComponentProps,
} from 'stream-chat-react';
import 'stream-chat-react/css/index.css';
import { useAdminApi } from '@/lib/use-admin-api';

const STREAM_BOT_USER_ID = 'faralin-bot';

const LEGACY_STATUS_PATTERNS = [
  /^You have been connected to the support queue\./,
  / joined the conversation\.$/,
  /^A support agent has joined\.$/,
  /^This conversation has been marked resolved\./,
];

type FaralinMessageMeta = {
  type?: string;
  text?: string;
  user?: { id?: string };
  custom?: { faralinSystem?: boolean; audience?: string };
};

function shouldHideFromAgent(message: FaralinMessageMeta | null | undefined): boolean {
  if (!message) return true;

  const custom = message.custom as { faralinSystem?: boolean; audience?: string } | undefined;

  if (custom?.faralinSystem && custom.audience === 'requester') {
    return true;
  }

  if (message.type === 'system') {
    return true;
  }

  if (message.user?.id === STREAM_BOT_USER_ID) {
    return true;
  }

  const text = message.text?.trim() ?? '';
  return LEGACY_STATUS_PATTERNS.some((pattern) => pattern.test(text));
}

function AgentMessage(props: MessageUIComponentProps) {
  if (shouldHideFromAgent(props.message as FaralinMessageMeta)) return null;
  if (!props.message) return null;
  return <Message {...props} message={props.message} />;
}

export function AdminLiveChat({ streamChannelId }: { streamChannelId: string }) {
  const { adminFetch } = useAdminApi();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let chatClient: StreamChat | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const tokenResponse = await adminFetch<{
          configured: boolean;
          apiKey?: string;
          token?: string;
          userId?: string;
          userName?: string;
        }>('/support/stream/token', { method: 'POST' });

        if (!tokenResponse?.configured || !tokenResponse.apiKey || !tokenResponse.token) {
          setError('Stream Chat is not configured.');
          return;
        }

        chatClient = StreamChat.getInstance(tokenResponse.apiKey);
        await chatClient.connectUser(
          { id: tokenResponse.userId!, name: tokenResponse.userName ?? 'Agent' },
          tokenResponse.token,
        );

        const channelId = streamChannelId.includes(':')
          ? streamChannelId.split(':')[1]
          : streamChannelId;
        const channel = chatClient.channel('faralin-support', channelId);
        await channel.watch();

        if (!cancelled) setClient(chatClient);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to connect');
      }
    }

    connect();
    return () => {
      cancelled = true;
      chatClient?.disconnectUser().catch(() => undefined);
    };
  }, [streamChannelId, adminFetch]);

  if (error) return <p className="admin-live-chat-error">{error}</p>;
  if (!client) return <p className="admin-live-chat-loading">Connecting to conversation…</p>;

  const channelId = streamChannelId.includes(':') ? streamChannelId.split(':')[1] : streamChannelId;
  const channel = client.channel('faralin-support', channelId);

  return (
    <div className="admin-live-chat">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <MessageList Message={AgentMessage} />
            <MessageComposer />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}
