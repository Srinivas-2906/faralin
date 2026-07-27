import { Controller, Get, Param, Patch, Body, Header, Post } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import type { CreateCampaignInput } from '@faralin/types';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupportBotService } from '../support/support-bot.service';
import { UniversitiesService } from './universities.service';
import type { BonusRule } from './staff-assessment-config';
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

  @Get('staff/assessments/series')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffAssessmentSeries(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffAssessmentSeries(user.universityId!);
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
    @Body()
    body: {
      enabled?: boolean;
      isCompulsory?: boolean;
      affectsBursaryEligibility?: boolean;
      bonusRules?: BonusRule[] | null;
    },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffTrackConfig(user.universityId!, trackId, body);
  }

  @Patch('staff/tracks/:trackId/reward')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffTrackReward(
    @CurrentUser() user: AuthUser,
    @Param('trackId') trackId: string,
    @Body() body: { scoreMultiplier: number },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffTrackReward(user.universityId!, trackId, body);
  }

  @Get('staff/journeys/library')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffJourneyLibrary(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffJourneyLibrary(user.universityId!);
  }

  @Patch('staff/journeys/:journeyId/config')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffJourneyConfig(
    @CurrentUser() user: AuthUser,
    @Param('journeyId') journeyId: string,
    @Body() body: { enabled?: boolean; bonusRules?: unknown },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffJourneyConfig(user.universityId!, journeyId, body);
  }

  @Get('staff/recognition-tiers')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffRecognitionTiers(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffRecognitionTiers(user.universityId!);
  }

  @Patch('staff/recognition-tiers')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffRecognitionTiers(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      tiers: Array<{ tier: string; minVerifiedFaralins: number; benefitsSummary?: string | null }>;
    },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffRecognitionTiers(user.universityId!, body.tiers);
  }

  @Get('staff/leaderboard/config')
  @Roles(UserRole.UNIVERSITY_STAFF)
  getStaffLeaderboardConfig(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffLeaderboardConfig(user.universityId!);
  }

  @Patch('staff/leaderboard/config')
  @Roles(UserRole.UNIVERSITY_STAFF)
  patchStaffLeaderboardConfig(
    @CurrentUser() user: AuthUser,
    @Body() body: { enabled?: boolean; scope?: string; optInRequired?: boolean },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.patchStaffLeaderboardConfig(user.universityId!, body);
  }

  @Get('staff/hear-export')
  @Roles(UserRole.UNIVERSITY_STAFF)
  @Header('Content-Type', 'text/csv')
  getStaffHearExport(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.getStaffHearExport(user.universityId!);
  }

  @Get('staff/campaigns')
  @Roles(UserRole.UNIVERSITY_STAFF)
  listStaffCampaigns(@CurrentUser() user: AuthUser) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.listStaffCampaigns(user.universityId!);
  }

  @Post('staff/campaigns')
  @Roles(UserRole.UNIVERSITY_STAFF)
  createStaffCampaign(@CurrentUser() user: AuthUser, @Body() body: CreateCampaignInput) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.createStaffCampaign(user.universityId!, body);
  }

  @Patch('staff/campaigns/:campaignId')
  @Roles(UserRole.UNIVERSITY_STAFF)
  updateStaffCampaign(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
    @Body() body: Partial<CreateCampaignInput> & { isActive?: boolean },
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.updateStaffCampaign(user.universityId!, campaignId, body);
  }

  @Patch('staff/campaigns/:campaignId/deactivate')
  @Roles(UserRole.UNIVERSITY_STAFF)
  deactivateStaffCampaign(
    @CurrentUser() user: AuthUser,
    @Param('campaignId') campaignId: string,
  ) {
    this.universities.requireUniversityAccess(user.universityId, user.universityId!);
    return this.universities.deactivateStaffCampaign(user.universityId!, campaignId);
  }

  @Public()
  @Get(':slug/leaderboard')
  getPublicLeaderboard(@Param('slug') slug: string) {
    return this.universities.getPublicLeaderboard(slug);
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
