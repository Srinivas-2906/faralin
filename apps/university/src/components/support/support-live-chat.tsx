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
import { useStaffApi } from '@/lib/use-staff-api';

export function SupportLiveChat({ streamChannelId }: { streamChannelId: string }) {
  const { staffFetch } = useStaffApi();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let chatClient: StreamChat | null = null;
    let cancelled = false;

    async function connect() {
      try {
        const tokenResponse = await staffFetch<{
          configured: boolean;
          apiKey?: string;
          token?: string;
          userId?: string;
          userName?: string;
        }>('/support/stream/token', { method: 'POST' });

        if (!tokenResponse?.configured || !tokenResponse.apiKey || !tokenResponse.token) {
          setError('Live chat is not configured yet.');
          return;
        }

        chatClient = StreamChat.getInstance(tokenResponse.apiKey);
        await chatClient.connectUser(
          { id: tokenResponse.userId!, name: tokenResponse.userName ?? 'Staff' },
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
  }, [streamChannelId, staffFetch]);

  if (error) return <p>{error}</p>;
  if (!client) return <p>Connecting to support agent…</p>;

  const channelId = streamChannelId.includes(':') ? streamChannelId.split(':')[1] : streamChannelId;
  const channel = client.channel('faralin-support', channelId);

  return (
    <div style={{ minHeight: '420px' }}>
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
