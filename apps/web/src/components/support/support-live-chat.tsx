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
import { useSupportApi } from '@/lib/use-support-api';

export function SupportLiveChat({ streamChannelId }: { streamChannelId: string }) {
  const { supportFetch } = useSupportApi();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let chatClient: StreamChat | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const tokenResponse = await supportFetch<{
          configured: boolean;
          apiKey?: string;
          token?: string;
          userId?: string;
          userName?: string;
        }>('/support/stream/token', { method: 'POST' });

        if (!tokenResponse.configured || !tokenResponse.apiKey || !tokenResponse.token) {
          setError('Live chat is not configured yet.');
          return;
        }

        chatClient = StreamChat.getInstance(tokenResponse.apiKey);
        await chatClient.connectUser(
          { id: tokenResponse.userId!, name: tokenResponse.userName ?? 'Student' },
          tokenResponse.token,
        );

        const channelId = streamChannelId.includes(':')
          ? streamChannelId.split(':')[1]
          : streamChannelId;

        const channel = chatClient.channel('faralin-support', channelId);
        await channel.watch();

        if (!cancelled) setClient(chatClient);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to connect to live chat');
        }
      }
    }

    connect();

    return () => {
      cancelled = true;
      chatClient?.disconnectUser().catch(() => undefined);
    };
  }, [streamChannelId, supportFetch]);

  if (error) {
    return <p style={{ color: 'var(--faralin-muted)' }}>{error}</p>;
  }

  if (!client) {
    return <p>Connecting to support agent…</p>;
  }

  const channelId = streamChannelId.includes(':') ? streamChannelId.split(':')[1] : streamChannelId;
  const channel = client.channel('faralin-support', channelId);

  return (
    <div className="support-live-chat" style={{ minHeight: '420px' }}>
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
