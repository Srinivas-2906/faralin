import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';
import { findOrCreateUserFromClerk } from './auth-user.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthUser } from './clerk-auth.types';

export type { AuthUser } from './clerk-auth.types';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const token = authHeader.slice(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY ?? '',
      });
      const clerkUserId = payload.sub;
      const email =
        typeof payload.email === 'string'
          ? payload.email
          : typeof payload.primary_email_address === 'string'
            ? payload.primary_email_address
            : undefined;

      const user = await findOrCreateUserFromClerk(this.prisma, clerkUserId, email);

      const authUser: AuthUser = {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        role: user.role,
        studentProfileId: user.studentProfile?.id,
        universityStaffProfileId: user.universityStaffProfile?.id,
        universityId: user.universityStaffProfile?.universityId,
      };

      request.user = authUser;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
