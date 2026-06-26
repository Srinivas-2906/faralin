import {
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { UserRole } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Post('webhooks/clerk')
  async handleClerkWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(webhookSecret);
    let payload: Record<string, unknown>;

    try {
      payload = wh.verify(req.rawBody as Buffer, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = payload.type as string;
    const data = payload.data as Record<string, unknown>;

    if (eventType === 'user.created') {
      const clerkUserId = data.id as string;
      const emailAddresses = data.email_addresses as Array<{ email_address: string; id: string }>;
      const primaryId = data.primary_email_address_id as string;
      const email =
        emailAddresses.find((e) => e.id === primaryId)?.email_address ?? 'unknown@faralin.com';

      const existing = await this.prisma.user.findUnique({ where: { clerkUserId } });
      if (!existing) {
        await this.prisma.user.create({
          data: {
            clerkUserId,
            email,
            role: UserRole.STUDENT,
            studentProfile: {
              create: {
                anonymousId: generateAnonymousId(),
              },
            },
          },
        });
      }
    }

    if (eventType === 'user.deleted') {
      const clerkUserId = data.id as string;
      await this.prisma.user.updateMany({
        where: { clerkUserId },
        data: { isActive: false },
      });
    }

    return { received: true };
  }
}

function generateAnonymousId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${letter}${num}`;
}
