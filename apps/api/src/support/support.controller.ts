import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { TicketChannel, TicketPriority, TicketStatus, UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.types';
import { SupportService } from './support.service';

@Controller('support')
@Roles(UserRole.SUPPORT_AGENT, UserRole.ADMIN)
export class SupportController {
  constructor(private support: SupportService) {}

  @Get('me')
  getMe(@Req() req: { user: AuthUser }) {
    return this.support.getMe(req.user);
  }

  @Get('dashboard')
  getDashboard(@Req() req: { user: AuthUser }) {
    return this.support.getDashboard(req.user);
  }

  @Get('categories')
  listCategories() {
    return this.support.listCategories();
  }

  @Get('tickets')
  listTickets(
    @Req() req: { user: AuthUser },
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('mine') mine?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.support.listTickets(req.user, {
      status,
      priority,
      assigneeId,
      categoryId,
      search,
      mine,
      page,
      limit,
    });
  }

  @Post('tickets')
  createTicket(
    @Req() req: { user: AuthUser },
    @Body()
    body: {
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
    return this.support.createTicket(req.user, body);
  }

  @Get('tickets/:id')
  getTicket(@Req() req: { user: AuthUser }, @Param('id') id: string) {
    return this.support.getTicket(req.user, id);
  }

  @Patch('tickets/:id')
  updateTicket(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body()
    body: {
      status?: TicketStatus;
      priority?: TicketPriority;
      assigneeId?: string | null;
      categoryId?: string;
      dueAt?: string | null;
      tags?: string[];
    },
  ) {
    return this.support.updateTicket(req.user, id, body);
  }

  @Post('tickets/:id/messages')
  addMessage(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Body() body: { body: string; isInternal?: boolean },
  ) {
    return this.support.addMessage(req.user, id, body);
  }

  @Get('agents')
  @Roles(UserRole.ADMIN)
  listAgents(@Req() req: { user: AuthUser }) {
    return this.support.listAgents(req.user);
  }

  @Post('agents')
  @Roles(UserRole.ADMIN)
  createAgent(
    @Req() req: { user: AuthUser },
    @Body() body: { email: string; displayName?: string; jobTitle?: string },
  ) {
    return this.support.createAgent(req.user, body);
  }

  @Get('students/search')
  searchStudents(@Req() req: { user: AuthUser }, @Query('q') q: string) {
    return this.support.searchStudents(req.user, q ?? '');
  }
}
