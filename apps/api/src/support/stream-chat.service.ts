import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';

export const STREAM_BOT_USER_ID = 'faralin-bot';
export const STREAM_CHANNEL_TYPE = 'faralin-support';

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

  createToken(userId: string) {
    const client = this.getClient();
    return client.createToken(userId);
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
    await this.upsertUser({ id: agentUserId, name: agentName });
    const channel = client.channel(
      STREAM_CHANNEL_TYPE,
      streamChannelId.split(':')[1] ?? streamChannelId,
    );
    await channel.addMembers([agentUserId]);
  }

  async postSystemMessage(streamChannelId: string, text: string) {
    const client = this.getClient();
    const channel = client.channel(
      STREAM_CHANNEL_TYPE,
      streamChannelId.split(':')[1] ?? streamChannelId,
    );
    await channel.sendMessage({
      text,
      user_id: STREAM_BOT_USER_ID,
    });
  }
}
