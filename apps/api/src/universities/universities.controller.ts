import { Controller, Get, Param } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UniversitiesService } from './universities.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('universities')
export class UniversitiesController {
  constructor(
    private universities: UniversitiesService,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  listAll() {
    return this.prisma.university.findMany({
      where: { isActive: true },
      include: { conversionRule: true },
      orderBy: { name: 'asc' },
    });
  }

  @Get('staff/me')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffMe(@CurrentUser() user: AuthUser) {
    return this.universities.getStaffMe(user.id);
  }

  @Get('staff/students')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffStudents(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffStudents(user.universityId!);
  }

  @Get('staff/dashboard')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffDashboard(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffDashboard(user.universityId!);
  }

  @Public()
  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.universities.getPublicUniversity(slug);
  }
}
