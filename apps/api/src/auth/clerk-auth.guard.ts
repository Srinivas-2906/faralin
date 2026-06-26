import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';

export interface AuthUser {
  id: string;
  clerkUserId: string;
  email: string;
  role: string;
  studentProfileId?: string;
  universityStaffProfileId?: string;
  universityId?: string;
}

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

      let user = await this.prisma.user.findUnique({
        where: { clerkUserId },
        include: {
          studentProfile: true,
          universityStaffProfile: true,
        },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            clerkUserId,
            email: `user-${clerkUserId.slice(-8)}@faralin.local`,
            role: 'STUDENT',
            studentProfile: {
              create: {
                anonymousId: generateAnonymousId(),
              },
            },
          },
          include: {
            studentProfile: true,
            universityStaffProfile: true,
          },
        });
      }

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

function generateAnonymousId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${letter}${num}`;
}
