import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.types';
import { SupportBotService } from './support-bot.service';

@Controller('support/bot')
@Roles(UserRole.STUDENT, UserRole.UNIVERSITY_STAFF)
export class SupportBotController {
  constructor(private bot: SupportBotService) {}

  @Get('session')
  getSession(@Req() req: { user: AuthUser }) {
    return this.bot.getOrCreateSession(req.user);
  }

  @Post('message')
  sendMessage(
    @Req() req: { user: AuthUser },
    @Body() body: { ticketId: string; message: string },
  ) {
    return this.bot.sendMessage(req.user, body.ticketId, body.message);
  }

  @Post('escalate')
  escalate(@Req() req: { user: AuthUser }, @Body() body: { ticketId: string }) {
    return this.bot.escalate(req.user, body.ticketId);
  }
}

@Controller('support/my')
@Roles(UserRole.STUDENT, UserRole.UNIVERSITY_STAFF)
export class SupportMyController {
  constructor(private bot: SupportBotService) {}

  @Get('tickets')
  listTickets(@Req() req: { user: AuthUser }) {
    return this.bot.listMyTickets(req.user);
  }
}
