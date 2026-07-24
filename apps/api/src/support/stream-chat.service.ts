import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';

export const STREAM_BOT_USER_ID = 'faralin-bot';
export const STREAM_CHANNEL_TYPE = 'faralin-support';
export const STREAM_AGENT_ROLE = 'admin';

export type StreamSystemMessageAudience = 'requester' | 'all';

/** Grants for support channel members (students, staff, agents). */
export const STREAM_SUPPORT_CHANNEL_GRANTS: Record<string, string[]> = {
  channel_member: [
    'read-channel',
    'read-channel-members',
    'create-message',
    'update-message-owner',
    'delete-message-owner',
    'create-reaction',
    'delete-reaction',
    'upload-attachment',
  ],
  user: [
    'read-channel',
    'read-channel-members',
    'create-message',
    'update-message-owner',
    'delete-message-owner',
    'create-reaction',
    'delete-reaction',
    'upload-attachment',
  ],
};

@Injectable()
export class StreamChatService {
  private client: StreamChat | null = null;

  constructor(private config: ConfigService) {}

  private getClient(): StreamChat {
    if (this.client) return this.client;

    const apiKey = this.config.get<string>('STREAM_API_KEY')?.trim();
    const apiSecret = this.config.get<string>('STREAM_API_SECRET')?.trim();

    if (!apiKey || !apiSecret) {
      throw new ServiceUnavailableException('Stream Chat is not configured');
    }

    this.client = StreamChat.getInstance(apiKey, apiSecret);
    return this.client;
  }

  isConfigured() {
    return Boolean(
      this.config.get<string>('STREAM_API_KEY')?.trim() &&
        this.config.get<string>('STREAM_API_SECRET')?.trim(),
    );
  }

  getApiKey() {
    return this.config.get<string>('STREAM_API_KEY')?.trim() ?? '';
  }

  async ensureBotUser() {
    const client = this.getClient();
    await client.upsertUser({
      id: STREAM_BOT_USER_ID,
      name: 'Faralin Assistant',
      role: 'user',
    });
  }

  async upsertUser(params: {
    id: string;
    name: string;
    role?: string;
    image?: string;
  }) {
    const client = this.getClient();
    await client.upsertUser({
      id: params.id,
      name: params.name,
      role: params.role ?? 'user',
      image: params.image,
    });
  }

  async upsertAgentUser(params: { id: string; name: string }) {
    await this.upsertUser({ ...params, role: STREAM_AGENT_ROLE });
  }

  createToken(userId: string) {
    const client = this.getClient();
    return client.createToken(userId);
  }

  async ensureChannelTypePermissions() {
    const client = this.getClient();
    const channelTypeConfig = {
      typing_events: true,
      read_events: true,
      connect_events: true,
      search: false,
      reactions: true,
      replies: false,
      mutes: true,
      quotes: false,
      grants: STREAM_SUPPORT_CHANNEL_GRANTS,
    };

    try {
      await client.createChannelType({ name: STREAM_CHANNEL_TYPE, ...channelTypeConfig });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already exists') || message.includes('code 4')) {
        await client.updateChannelType(STREAM_CHANNEL_TYPE, channelTypeConfig);
      } else {
        throw err;
      }
    }
  }

  channelIdForTicket(ticketId: string) {
    return `ticket-${ticketId}`;
  }

  async createSupportChannel(params: {
    ticketId: string;
    ticketNumber: string;
    requesterUserId: string;
    requesterName: string;
    requesterType: string;
    universityId?: string | null;
    universityName?: string | null;
    anonymousId?: string | null;
  }) {
    const client = this.getClient();
    await this.ensureChannelTypePermissions();
    await this.ensureBotUser();
    await this.upsertUser({ id: params.requesterUserId, name: params.requesterName });

    const channelId = this.channelIdForTicket(params.ticketId);
    const channel = client.channel(STREAM_CHANNEL_TYPE, channelId, {
      ticket_id: params.ticketId,
      ticket_number: params.ticketNumber,
      requester_type: params.requesterType,
      university_id: params.universityId ?? undefined,
      university_name: params.universityName ?? undefined,
      anonymous_id: params.anonymousId ?? undefined,
      created_by_id: params.requesterUserId,
    } as Record<string, unknown>);

    await channel.create();
    await channel.addMembers([params.requesterUserId, STREAM_BOT_USER_ID]);

    return `${STREAM_CHANNEL_TYPE}:${channelId}`;
  }

  async addAgentToChannel(streamChannelId: string, agentUserId: string, agentName: string) {
    const client = this.getClient();
    await this.upsertAgentUser({ id: agentUserId, name: agentName });
    const channel = client.channel(
      STREAM_CHANNEL_TYPE,
      streamChannelId.split(':')[1] ?? streamChannelId,
    );
    await channel.addMembers([agentUserId]);
  }

  async postSystemMessage(
    streamChannelId: string,
    text: string,
    audience: StreamSystemMessageAudience = 'all',
  ) {
    const client = this.getClient();
    const channel = client.channel(
      STREAM_CHANNEL_TYPE,
      streamChannelId.split(':')[1] ?? streamChannelId,
    );
    await channel.sendMessage({
      text,
      type: 'system',
      custom: {
        faralinSystem: true,
        audience,
      },
    } as Parameters<typeof channel.sendMessage>[0]);
  }
}
