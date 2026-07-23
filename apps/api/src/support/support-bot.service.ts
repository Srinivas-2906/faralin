import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  SupportBotRole,
  SupportConversationPhase,
  SupportRequesterType,
  TicketChannel,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@faralin/db';
import { AuthUser } from '../auth/clerk-auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { StreamChatService } from './stream-chat.service';

const ESCALATION_KEYWORDS = [
  'agent',
  'human',
  'person',
  'not helpful',
  'talk to someone',
  'representative',
];

@Injectable()
export class SupportBotService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private stream: StreamChatService,
  ) {}

  private async nextTicketNumber() {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}-`;
    const latest = await this.prisma.supportTicket.findFirst({
      where: { ticketNumber: { startsWith: prefix } },
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    const nextSeq = latest
      ? Number.parseInt(latest.ticketNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(5, '0')}`;
  }

  private resolveRequesterType(user: AuthUser): SupportRequesterType {
    if (user.role === UserRole.UNIVERSITY_STAFF) return SupportRequesterType.UNIVERSITY_STAFF;
    if (user.role === UserRole.STUDENT) return SupportRequesterType.STUDENT;
    return SupportRequesterType.INTERNAL;
  }

  private requireCustomer(user: AuthUser) {
    if (
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.UNIVERSITY_STAFF
    ) {
      throw new ForbiddenException('Support chat is for students and university staff');
    }
  }

  private async loadRequesterProfile(user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        universityStaffProfile: { include: { university: true } },
      },
    });
  }

  private async defaultCategoryId() {
    const category =
      (await this.prisma.supportCategory.findFirst({
        where: { slug: 'general', isActive: true },
      })) ??
      (await this.prisma.supportCategory.findFirst({ where: { isActive: true } }));
    if (!category) {
      throw new BadRequestException('No support categories configured');
    }
    return category.id;
  }

  async getOrCreateSession(user: AuthUser) {
    this.requireCustomer(user);

    const existing = await this.prisma.supportTicket.findFirst({
      where: {
        requesterUserId: user.id,
        conversationPhase: {
          in: [
            SupportConversationPhase.BOT,
            SupportConversationPhase.WAITING_AGENT,
            SupportConversationPhase.AGENT,
          ],
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        botTurns: { orderBy: { createdAt: 'asc' }, take: 50 },
        category: true,
        university: { select: { id: true, name: true } },
      },
    });

    if (existing) {
      return this.formatSession(existing);
    }

    const profile = await this.loadRequesterProfile(user);
    if (!profile) throw new NotFoundException('User not found');

    const requesterType = this.resolveRequesterType(user);
    const requesterName =
      profile.studentProfile?.firstName && profile.studentProfile?.lastName
        ? `${profile.studentProfile.firstName} ${profile.studentProfile.lastName}`
        : profile.universityStaffProfile?.university?.name
          ? `${profile.email} (${profile.universityStaffProfile.university.name})`
          : profile.email;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: await this.nextTicketNumber(),
        subject: 'Live support chat',
        description: 'Support conversation started via help centre.',
        categoryId: await this.defaultCategoryId(),
        channel: TicketChannel.CHAT,
        priority: TicketPriority.MEDIUM,
        requesterName,
        requesterEmail: profile.email,
        requesterUserId: user.id,
        requesterType,
        universityId: profile.universityStaffProfile?.universityId ?? null,
        studentProfileId: profile.studentProfile?.id ?? null,
        createdById: user.id,
        conversationPhase: SupportConversationPhase.BOT,
        botSessionId: crypto.randomUUID(),
        dueAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      include: {
        botTurns: true,
        category: true,
        university: { select: { id: true, name: true } },
      },
    });

    await this.prisma.supportTicketEvent.create({
      data: {
        ticketId: ticket.id,
        actorUserId: user.id,
        eventType: 'BOT_SESSION_STARTED',
      },
    });

    return this.formatSession(ticket);
  }

  private formatSession(
    ticket: Prisma.SupportTicketGetPayload<{
      include: {
        botTurns: true;
        category: true;
        university: { select: { id: true; name: true } };
      };
    }>,
  ) {
    return {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      conversationPhase: ticket.conversationPhase,
      streamChannelId: ticket.streamChannelId,
      category: ticket.category.name,
      university: ticket.university,
      suggestEscalation:
        ticket.lastBotConfidence !== null && ticket.lastBotConfidence < 0.45,
      botTurns: ticket.botTurns.map((turn) => ({
        id: turn.id,
        role: turn.role,
        body: turn.body,
        confidence: turn.confidence,
        createdAt: turn.createdAt,
      })),
    };
  }

  async sendMessage(user: AuthUser, ticketId: string, message: string) {
    this.requireCustomer(user);
    const trimmed = message.trim();
    if (!trimmed) throw new BadRequestException('Message is required');

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { botTurns: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });

    if (!ticket || ticket.requesterUserId !== user.id) {
      throw new NotFoundException('Support session not found');
    }

    if (ticket.conversationPhase !== SupportConversationPhase.BOT) {
      throw new BadRequestException('This conversation is no longer in bot mode');
    }

    await this.prisma.supportBotTurn.create({
      data: { ticketId, role: SupportBotRole.USER, body: trimmed },
    });

    const botReply = await this.generateBotReply(user, ticket, trimmed);
    const suggestEscalation =
      botReply.confidence < 0.45 ||
      ESCALATION_KEYWORDS.some((kw) => trimmed.toLowerCase().includes(kw));

    await this.prisma.supportBotTurn.create({
      data: {
        ticketId,
        role: SupportBotRole.BOT,
        body: botReply.message,
        confidence: botReply.confidence,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastBotConfidence: botReply.confidence,
        description: trimmed.slice(0, 500),
      },
    });

    return {
      ticketId,
      userMessage: trimmed,
      botMessage: botReply.message,
      confidence: botReply.confidence,
      suggestEscalation,
      source: botReply.source,
    };
  }

  private async generateBotReply(
    user: AuthUser,
    ticket: { id: string; requesterType: SupportRequesterType; botTurns: Array<{ role: SupportBotRole; body: string }> },
    message: string,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY')?.trim();
    const categories = await this.prisma.supportCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const systemPrompt =
      ticket.requesterType === SupportRequesterType.UNIVERSITY_STAFF
        ? `You are Faralin's support assistant for university staff. Help with the university portal: student pipeline, applications, articles, events, and partnership questions. Be concise. If you cannot help confidently, say you'd connect them with a human agent. Categories: ${categories.map((c) => c.name).join(', ')}.`
        : `You are Faralin's support assistant for students. Help with accounts, assessments, Faralins, problem tracks, applications, and the knowledge centre. Be concise and friendly. If you cannot help confidently, say you'd connect them with a human agent. Categories: ${categories.map((c) => c.name).join(', ')}.`;

    const history = ticket.botTurns
      .slice(-8)
      .map((turn) => `${turn.role === SupportBotRole.USER ? 'User' : 'Assistant'}: ${turn.body}`)
      .join('\n');

    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini',
            temperature: 0.4,
            messages: [
              { role: 'system', content: systemPrompt },
              {
                role: 'user',
                content: `${history}\nUser: ${message}\n\nReply helpfully in 2-4 sentences.`,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content) {
            return {
              message: content,
              confidence: content.toLowerCase().includes('human agent') ? 0.35 : 0.72,
              source: 'llm' as const,
            };
          }
        }
      } catch {
        // fall through
      }
    }

    return {
      message:
        "Thanks for your message. I can help with Faralin accounts, assessments, and portal questions. If you'd like to speak with a support agent, tap **Talk to an agent**.",
      confidence: 0.5,
      source: 'rules' as const,
    };
  }

  async escalate(user: AuthUser, ticketId: string) {
    this.requireCustomer(user);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        university: true,
        studentProfile: true,
        requester: true,
      },
    });

    if (!ticket || ticket.requesterUserId !== user.id) {
      throw new NotFoundException('Support session not found');
    }

    if (
      ticket.conversationPhase === SupportConversationPhase.WAITING_AGENT ||
      ticket.conversationPhase === SupportConversationPhase.AGENT
    ) {
      return {
        ticketId: ticket.id,
        streamChannelId: ticket.streamChannelId,
        conversationPhase: ticket.conversationPhase,
      };
    }

    if (!this.stream.isConfigured()) {
      throw new BadRequestException('Live chat is not available yet. Please try again later.');
    }

    const streamChannelId =
      ticket.streamChannelId ??
      (await this.stream.createSupportChannel({
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        requesterUserId: user.id,
        requesterName: ticket.requesterName,
        requesterType: ticket.requesterType,
        universityId: ticket.universityId,
        universityName: ticket.university?.name ?? null,
        anonymousId: ticket.studentProfile?.anonymousId ?? null,
      }));

    await this.stream.postSystemMessage(
      streamChannelId,
      'You have been connected to the support queue. An agent will join shortly.',
    );

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        streamChannelId,
        conversationPhase: SupportConversationPhase.WAITING_AGENT,
        escalatedAt: new Date(),
        channel: TicketChannel.CHAT,
        status: TicketStatus.OPEN,
      },
    });

    await this.prisma.supportTicketEvent.create({
      data: {
        ticketId,
        actorUserId: user.id,
        eventType: 'ESCALATED_TO_AGENT',
        metadata: { streamChannelId },
      },
    });

    return {
      ticketId: updated.id,
      streamChannelId: updated.streamChannelId,
      conversationPhase: updated.conversationPhase,
    };
  }

  async listMyTickets(user: AuthUser) {
    this.requireCustomer(user);

    return this.prisma.supportTicket.findMany({
      where: { requesterUserId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        conversationPhase: true,
        streamChannelId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async listUniversityTickets(user: AuthUser) {
    if (user.role !== UserRole.UNIVERSITY_STAFF || !user.universityId) {
      throw new ForbiddenException('University staff access required');
    }

    return this.prisma.supportTicket.findMany({
      where: { universityId: user.universityId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        conversationPhase: true,
        requesterName: true,
        requesterType: true,
        streamChannelId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
