import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  SupportConversationPhase,
  TicketStatus,
  UserRole,
} from '@faralin/db';
import { AuthUser } from '../auth/clerk-auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { StreamChatService } from './stream-chat.service';

@Injectable()
export class SupportLiveService {
  constructor(
    private prisma: PrismaService,
    private stream: StreamChatService,
    private config: ConfigService,
  ) {}

  private isAgent(user: AuthUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT_AGENT;
  }

  async createStreamToken(user: AuthUser) {
    if (!this.stream.isConfigured()) {
      return { configured: false as const };
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        supportAgentProfile: true,
        universityStaffProfile: { include: { university: true } },
      },
    });

    if (!dbUser) throw new NotFoundException('User not found');

    let displayName = dbUser.email;
    if (dbUser.supportAgentProfile?.displayName) {
      displayName = dbUser.supportAgentProfile.displayName;
    } else if (dbUser.studentProfile?.firstName) {
      displayName = `${dbUser.studentProfile.firstName} ${dbUser.studentProfile.lastName ?? ''}`.trim();
    } else if (dbUser.universityStaffProfile?.university) {
      displayName = `${dbUser.email} · ${dbUser.universityStaffProfile.university.shortName ?? dbUser.universityStaffProfile.university.name}`;
    }

    if (this.isAgent(user)) {
      await this.stream.upsertAgentUser({ id: dbUser.id, name: displayName });
    } else {
      await this.stream.upsertUser({
        id: dbUser.id,
        name: displayName,
      });
    }

    return {
      configured: true as const,
      apiKey: this.stream.getApiKey(),
      token: this.stream.createToken(dbUser.id),
      userId: dbUser.id,
      userName: displayName,
    };
  }

  async listLive(user: AuthUser) {
    if (!this.isAgent(user)) {
      throw new ForbiddenException('Agent access required');
    }

    return this.prisma.supportTicket.findMany({
      where: {
        streamChannelId: { not: null },
        conversationPhase: {
          in: [
            SupportConversationPhase.WAITING_AGENT,
            SupportConversationPhase.AGENT,
          ],
        },
        status: { not: TicketStatus.CLOSED },
      },
      orderBy: [{ conversationPhase: 'asc' }, { escalatedAt: 'asc' }],
      include: {
        requester: { select: { id: true, email: true } },
        university: { select: { id: true, name: true, shortName: true } },
        studentProfile: { select: { anonymousId: true } },
        assignee: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true } },
          },
        },
      },
    });
  }

  async joinLive(user: AuthUser, ticketId: string) {
    if (!this.isAgent(user)) {
      throw new ForbiddenException('Agent access required');
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        requester: true,
        assignee: { include: { supportAgentProfile: true } },
      },
    });

    if (!ticket?.streamChannelId) {
      throw new NotFoundException('Live conversation not found');
    }

    const agentName =
      (await this.prisma.supportAgentProfile.findUnique({ where: { userId: user.id } }))
        ?.displayName ?? user.email;

    await this.stream.addAgentToChannel(ticket.streamChannelId, user.id, agentName);
    await this.stream.postSystemMessage(
      ticket.streamChannelId,
      `${agentName} joined the conversation.`,
    );

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assigneeId: user.id,
        conversationPhase: SupportConversationPhase.AGENT,
        status: TicketStatus.IN_PROGRESS,
      },
      include: {
        requester: { select: { id: true, email: true } },
        university: { select: { id: true, name: true } },
        studentProfile: { select: { anonymousId: true } },
        assignee: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true } },
          },
        },
      },
    });

    await this.prisma.supportTicketEvent.create({
      data: {
        ticketId,
        actorUserId: user.id,
        eventType: 'AGENT_JOINED',
      },
    });

    return updated;
  }

  private verifyWebhookSignature(rawBody: string, signature?: string) {
    const secret =
      this.config.get<string>('STREAM_WEBHOOK_SECRET')?.trim() ||
      this.config.get<string>('STREAM_API_SECRET')?.trim();

    if (!secret || !signature) return;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    const provided = signature.replace(/^sha256=/, '');

    try {
      if (
        expected.length !== provided.length ||
        !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))
      ) {
        throw new UnauthorizedException('Invalid Stream webhook signature');
      }
    } catch {
      throw new UnauthorizedException('Invalid Stream webhook signature');
    }
  }

  async handleStreamWebhook(body: Record<string, unknown>, rawBody: string, signature?: string) {
    this.verifyWebhookSignature(rawBody, signature);

    const eventType = typeof body.type === 'string' ? body.type : '';
    if (eventType !== 'message.new') {
      return { received: true, handled: false };
    }

    const cid = typeof body.cid === 'string' ? body.cid : null;
    const messageUser =
      body.message && typeof body.message === 'object'
        ? (body.message as { user?: { id?: string } }).user
        : undefined;
    const userId = messageUser?.id ?? (body.user as { id?: string } | undefined)?.id;

    if (!cid || !userId) {
      return { received: true, handled: false };
    }

    const ticket = await this.prisma.supportTicket.findFirst({
      where: { streamChannelId: cid },
    });

    if (!ticket) {
      return { received: true, handled: false };
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAgent =
      sender?.role === UserRole.SUPPORT_AGENT || sender?.role === UserRole.ADMIN;

    if (
      isAgent &&
      ticket.conversationPhase === SupportConversationPhase.WAITING_AGENT
    ) {
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          conversationPhase: SupportConversationPhase.AGENT,
          status: TicketStatus.IN_PROGRESS,
          assigneeId: ticket.assigneeId ?? userId,
        },
      });
    }

    return { received: true, handled: true };
  }

  async resolveLive(user: AuthUser, ticketId: string) {
    if (!this.isAgent(user)) {
      throw new ForbiddenException('Agent access required');
    }

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    if (ticket.streamChannelId) {
      await this.stream.postSystemMessage(
        ticket.streamChannelId,
        'This conversation has been marked resolved. Thank you for contacting Faralin support.',
      );
    }

    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        conversationPhase: SupportConversationPhase.RESOLVED,
        status: TicketStatus.RESOLVED,
        resolvedAt: new Date(),
      },
    });
  }
}
