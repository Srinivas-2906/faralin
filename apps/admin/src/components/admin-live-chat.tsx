'use client';

import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Window,
} from 'stream-chat-react';
import 'stream-chat-react/css/index.css';
import { useAdminApi } from '@/lib/use-admin-api';

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

  if (error) return <p>{error}</p>;
  if (!client) return <p>Connecting to conversation…</p>;

  const channelId = streamChannelId.includes(':') ? streamChannelId.split(':')[1] : streamChannelId;
  const channel = client.channel('faralin-support', channelId);

  return (
    <div style={{ minHeight: '480px' }}>
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}
