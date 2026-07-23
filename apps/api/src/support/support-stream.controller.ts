import { Body, Controller, Get, Headers, Param, Post, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.types';
import { Public } from '../auth/public.decorator';
import { SupportLiveService } from './support-live.service';

@Controller('support/stream')
export class SupportStreamController {
  constructor(private live: SupportLiveService) {}

  @Post('token')
  @Roles(UserRole.STUDENT, UserRole.UNIVERSITY_STAFF, UserRole.SUPPORT_AGENT, UserRole.ADMIN)
  createToken(@Req() req: { user: AuthUser }) {
    return this.live.createStreamToken(req.user);
  }

  @Public()
  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature?: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? JSON.stringify(body);
    return this.live.handleStreamWebhook(body, rawBody, signature);
  }
}

@Controller('support/live')
@Roles(UserRole.SUPPORT_AGENT, UserRole.ADMIN)
export class SupportLiveController {
  constructor(private live: SupportLiveService) {}

  @Get()
  listLive(@Req() req: { user: AuthUser }) {
    return this.live.listLive(req.user);
  }

  @Post(':ticketId/join')
  joinLive(@Req() req: { user: AuthUser }, @Param('ticketId') ticketId: string) {
    return this.live.joinLive(req.user, ticketId);
  }

  @Post(':ticketId/resolve')
  resolveLive(@Req() req: { user: AuthUser }, @Param('ticketId') ticketId: string) {
    return this.live.resolveLive(req.user, ticketId);
  }
}
