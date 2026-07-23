import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupportBotService } from '../support/support-bot.service';
import { UniversitiesService } from './universities.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('universities')
export class UniversitiesController {
  constructor(
    private universities: UniversitiesService,
    private prisma: PrismaService,
    private supportBot: SupportBotService,
  ) {}

  @Public()
  @Get()
  listAll() {
    return this.prisma.university.findMany({
      where: { isActive: true },
      include: { conversionRule: true },
      orderBy: [{ guardianRank2025: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
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

  @Get('staff/students/:anonymousId')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffStudentDetail(
    @CurrentUser() user: AuthUser,
    @Param('anonymousId') anonymousId: string,
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffStudentDetail(user.universityId!, anonymousId);
  }

  @Get('staff/assessments/library')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffAssessmentLibrary(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffAssessmentLibrary(user.universityId!);
  }

  @Get('staff/assessments/active')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffActiveAssessments(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffActiveAssessments(user.universityId!);
  }

  @Patch('staff/assessments/:assessmentId/config')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffAssessmentConfig(
    @CurrentUser() user: AuthUser,
    @Param('assessmentId') assessmentId: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffAssessmentConfig(user.universityId!, assessmentId, body);
  }

  @Patch('staff/assessments/:assessmentId/reward')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffAssessmentReward(
    @CurrentUser() user: AuthUser,
    @Param('assessmentId') assessmentId: string,
    @Body() body: { baseAmount: number; scoreMultiplier?: number; improvementBonus?: number },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffAssessmentReward(user.universityId!, assessmentId, body);
  }

  @Get('staff/tracks/library')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffTrackLibrary(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffTrackLibrary(user.universityId!);
  }

  @Patch('staff/tracks/:trackId/config')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffTrackConfig(
    @CurrentUser() user: AuthUser,
    @Param('trackId') trackId: string,
    @Body() body: { enabled?: boolean; isCompulsory?: boolean },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffTrackConfig(user.universityId!, trackId, body);
  }

  @Get('staff/dashboard')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffDashboard(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffDashboard(user.universityId!);
  }

  @Get('staff/support/tickets')
  @Roles(UserRole.UNIVERSITY_STAFF)
  listSupportTickets(@CurrentUser() user: AuthUser) {
    return this.supportBot.listUniversityTickets(user);
  }

  @Public()
  @Get(':slug')
  getPublic(@Param('slug') slug: string) {
    return this.universities.getPublicUniversity(slug);
  }
}
