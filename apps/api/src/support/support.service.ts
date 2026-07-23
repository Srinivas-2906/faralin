import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TicketChannel,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@faralin/db';
import { pendingClerkUserId } from '../auth/auth-user.service';
import { AuthUser } from '../auth/clerk-auth.types';
import { PrismaService } from '../prisma/prisma.service';

const OPEN_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING,
];

function slaHoursForPriority(priority: TicketPriority): number {
  switch (priority) {
    case TicketPriority.URGENT:
      return 4;
    case TicketPriority.HIGH:
      return 24;
    case TicketPriority.MEDIUM:
      return 48;
    default:
      return 72;
  }
}

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  private isAdmin(user: AuthUser) {
    return user.role === UserRole.ADMIN;
  }

  private isSupportUser(user: AuthUser) {
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPPORT_AGENT;
  }

  private requireSupportUser(user: AuthUser) {
    if (!this.isSupportUser(user)) {
      throw new ForbiddenException('Support access required');
    }
  }

  private requireAdmin(user: AuthUser) {
    if (!this.isAdmin(user)) {
      throw new ForbiddenException('Admin access required');
    }
  }

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

  private async recordEvent(
    ticketId: string,
    actorUserId: string | null,
    eventType: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.supportTicketEvent.create({
      data: {
        ticketId,
        actorUserId,
        eventType,
        metadata,
      },
    });
  }

  private async recordAudit(
    actorUserId: string,
    action: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType: 'SupportTicket',
        entityId,
        metadata,
      },
    });
  }

  async getMe(user: AuthUser) {
    this.requireSupportUser(user);

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        adminProfile: true,
        supportAgentProfile: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
      },
      agent: dbUser.supportAgentProfile
        ? {
            displayName: dbUser.supportAgentProfile.displayName,
            jobTitle: dbUser.supportAgentProfile.jobTitle,
            isActive: dbUser.supportAgentProfile.isActive,
          }
        : null,
      isAdmin: dbUser.role === UserRole.ADMIN,
    };
  }

  async getDashboard(user: AuthUser) {
    this.requireSupportUser(user);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const [
      open,
      unassigned,
      overdueSla,
      resolvedToday,
      myAssigned,
      byStatus,
    ] = await Promise.all([
      this.prisma.supportTicket.count({
        where: { status: { in: OPEN_STATUSES } },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: OPEN_STATUSES }, assigneeId: null },
      }),
      this.prisma.supportTicket.count({
        where: {
          status: { in: OPEN_STATUSES },
          dueAt: { lt: now },
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          status: { in: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          resolvedAt: { gte: startOfDay },
        },
      }),
      this.prisma.supportTicket.count({
        where: {
          assigneeId: user.id,
          status: { in: OPEN_STATUSES },
        },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    return {
      open,
      unassigned,
      overdueSla,
      resolvedToday,
      myAssigned,
      byStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
    };
  }

  async listCategories() {
    return this.prisma.supportCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async listTickets(
    user: AuthUser,
    query: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string;
      categoryId?: string;
      search?: string;
      mine?: string;
      page?: string;
      limit?: string;
    },
  ) {
    this.requireSupportUser(user);

    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '25', 10) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.SupportTicketWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.categoryId) where.categoryId = query.categoryId;

    if (query.mine === 'true') {
      where.assigneeId = user.id;
    } else if (query.assigneeId) {
      if (query.assigneeId === 'unassigned') {
        where.assigneeId = null;
      } else {
        where.assigneeId = query.assigneeId;
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { ticketNumber: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { requesterName: { contains: term, mode: 'insensitive' } },
        { requesterEmail: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          category: true,
          assignee: {
            select: {
              id: true,
              email: true,
              supportAgentProfile: { select: { displayName: true } },
            },
          },
          createdBy: { select: { id: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createTicket(
    user: AuthUser,
    data: {
      subject: string;
      description: string;
      categoryId: string;
      priority?: TicketPriority;
      channel?: TicketChannel;
      requesterName: string;
      requesterEmail?: string;
      requesterPhone?: string;
      studentProfileId?: string;
      tags?: string[];
      assigneeId?: string;
    },
  ) {
    this.requireSupportUser(user);

    const category = await this.prisma.supportCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category?.isActive) {
      throw new BadRequestException('Invalid category');
    }

    if (data.assigneeId && !this.isAdmin(user)) {
      throw new ForbiddenException('Only admins can assign tickets on create');
    }

    const priority = data.priority ?? TicketPriority.MEDIUM;
    const dueAt = new Date(Date.now() + slaHoursForPriority(priority) * 60 * 60 * 1000);
    const ticketNumber = await this.nextTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: data.subject,
        description: data.description,
        categoryId: data.categoryId,
        priority,
        channel: data.channel ?? TicketChannel.INTERNAL,
        requesterName: data.requesterName,
        requesterEmail: data.requesterEmail,
        requesterPhone: data.requesterPhone,
        studentProfileId: data.studentProfileId,
        tags: data.tags ?? [],
        assigneeId: data.assigneeId ?? null,
        createdById: user.id,
        dueAt,
      },
      include: {
        category: true,
        assignee: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true } },
          },
        },
        createdBy: { select: { id: true, email: true } },
      },
    });

    await this.recordEvent(ticket.id, user.id, 'CREATED', {
      ticketNumber: ticket.ticketNumber,
    });

    if (ticket.assigneeId) {
      await this.recordEvent(ticket.id, user.id, 'ASSIGNED', {
        assigneeId: ticket.assigneeId,
      });
    }

    await this.recordAudit(user.id, 'support.ticket.create', ticket.id, {
      ticketNumber: ticket.ticketNumber,
    });

    return ticket;
  }

  async getTicket(user: AuthUser, id: string) {
    this.requireSupportUser(user);

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        category: true,
        assignee: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true, jobTitle: true } },
          },
        },
        createdBy: { select: { id: true, email: true } },
        studentProfile: {
          select: {
            id: true,
            anonymousId: true,
            firstName: true,
            lastName: true,
            schoolName: true,
            user: { select: { email: true } },
          },
        },
        messages: {
          include: {
            author: {
              select: {
                id: true,
                email: true,
                supportAgentProfile: { select: { displayName: true } },
                adminProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        events: {
          include: {
            actor: { select: { id: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async updateTicket(
    user: AuthUser,
    id: string,
    data: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string | null;
      categoryId?: string;
      dueAt?: string | null;
      tags?: string[];
    },
  ) {
    this.requireSupportUser(user);

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updates: Prisma.SupportTicketUpdateInput = {};

    if (data.status !== undefined) {
      updates.status = data.status;
      if (data.status === TicketStatus.RESOLVED) {
        updates.resolvedAt = new Date();
      }
      if (data.status === TicketStatus.CLOSED) {
        updates.closedAt = new Date();
        if (!ticket.resolvedAt) {
          updates.resolvedAt = new Date();
        }
      }
    }

    if (data.priority !== undefined) {
      updates.priority = data.priority;
      if (!data.dueAt && data.dueAt !== null) {
        updates.dueAt = new Date(
          Date.now() + slaHoursForPriority(data.priority) * 60 * 60 * 1000,
        );
      }
    }

    if (data.categoryId !== undefined) {
      const category = await this.prisma.supportCategory.findUnique({
        where: { id: data.categoryId },
      });
      if (!category?.isActive) {
        throw new BadRequestException('Invalid category');
      }
      updates.category = { connect: { id: data.categoryId } };
    }

    if (data.dueAt !== undefined) {
      updates.dueAt = data.dueAt ? new Date(data.dueAt) : null;
    }

    if (data.tags !== undefined) {
      updates.tags = data.tags;
    }

    if (data.assigneeId !== undefined) {
      if (!this.isAdmin(user)) {
        const isSelfAssign =
          data.assigneeId === user.id &&
          (ticket.assigneeId === null || ticket.assigneeId === user.id);
        if (!isSelfAssign) {
          throw new ForbiddenException('Agents can only self-assign unassigned tickets');
        }
      }

      if (data.assigneeId === null) {
        updates.assignee = { disconnect: true };
      } else {
        const assignee = await this.prisma.user.findFirst({
          where: {
            id: data.assigneeId,
            role: { in: [UserRole.SUPPORT_AGENT, UserRole.ADMIN] },
            isActive: true,
          },
        });
        if (!assignee) {
          throw new BadRequestException('Invalid assignee');
        }
        updates.assignee = { connect: { id: data.assigneeId } };
      }
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: updates,
      include: {
        category: true,
        assignee: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true } },
          },
        },
        createdBy: { select: { id: true, email: true } },
      },
    });

    if (data.status !== undefined && data.status !== ticket.status) {
      await this.recordEvent(id, user.id, 'STATUS_CHANGED', {
        from: ticket.status,
        to: data.status,
      });
    }

    if (data.priority !== undefined && data.priority !== ticket.priority) {
      await this.recordEvent(id, user.id, 'PRIORITY_CHANGED', {
        from: ticket.priority,
        to: data.priority,
      });
    }

    if (data.assigneeId !== undefined && data.assigneeId !== ticket.assigneeId) {
      await this.recordEvent(id, user.id, 'ASSIGNED', {
        from: ticket.assigneeId,
        to: data.assigneeId,
      });
    }

    await this.recordAudit(user.id, 'support.ticket.update', id, {
      ticketNumber: ticket.ticketNumber,
    });

    return updated;
  }

  async addMessage(
    user: AuthUser,
    id: string,
    data: { body: string; isInternal?: boolean },
  ) {
    this.requireSupportUser(user);

    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const message = await this.prisma.supportTicketMessage.create({
      data: {
        ticketId: id,
        authorId: user.id,
        body: data.body,
        isInternal: data.isInternal ?? false,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            supportAgentProfile: { select: { displayName: true } },
          },
        },
      },
    });

    await this.recordEvent(id, user.id, data.isInternal ? 'INTERNAL_NOTE' : 'MESSAGE', {
      messageId: message.id,
    });

    if (
      ticket.status === TicketStatus.OPEN &&
      ticket.assigneeId === user.id
    ) {
      await this.prisma.supportTicket.update({
        where: { id },
        data: { status: TicketStatus.IN_PROGRESS },
      });
      await this.recordEvent(id, user.id, 'STATUS_CHANGED', {
        from: TicketStatus.OPEN,
        to: TicketStatus.IN_PROGRESS,
      });
    }

    return message;
  }

  async listAgents(user: AuthUser) {
    this.requireAdmin(user);

    const agents = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.SUPPORT_AGENT, UserRole.ADMIN] },
        isActive: true,
      },
      include: {
        supportAgentProfile: true,
        adminProfile: true,
        _count: {
          select: {
            ticketsAssigned: {
              where: { status: { in: OPEN_STATUSES } },
            },
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    return agents.map((agent) => ({
      id: agent.id,
      email: agent.email,
      role: agent.role,
      displayName: agent.supportAgentProfile?.displayName ?? null,
      jobTitle: agent.supportAgentProfile?.jobTitle ?? (agent.adminProfile ? 'Admin' : null),
      isActive: agent.supportAgentProfile?.isActive ?? true,
      openTicketCount: agent._count.ticketsAssigned,
    }));
  }

  async createAgent(
    user: AuthUser,
    data: { email: string; displayName?: string; jobTitle?: string },
  ) {
    this.requireAdmin(user);

    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const agent = await this.prisma.user.create({
      data: {
        clerkUserId: pendingClerkUserId(),
        email,
        role: UserRole.SUPPORT_AGENT,
        supportAgentProfile: {
          create: {
            displayName: data.displayName ?? email.split('@')[0],
            jobTitle: data.jobTitle ?? 'Support Agent',
          },
        },
      },
      include: { supportAgentProfile: true },
    });

    await this.recordAudit(user.id, 'support.agent.create', agent.id, { email });

    return agent;
  }

  async searchStudents(user: AuthUser, q: string) {
    this.requireSupportUser(user);

    const term = q.trim();
    if (term.length < 2) {
      return [];
    }

    return this.prisma.studentProfile.findMany({
      where: {
        OR: [
          { anonymousId: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        anonymousId: true,
        firstName: true,
        lastName: true,
        schoolName: true,
        user: { select: { email: true } },
      },
      take: 10,
      orderBy: { anonymousId: 'asc' },
    });
  }
}
