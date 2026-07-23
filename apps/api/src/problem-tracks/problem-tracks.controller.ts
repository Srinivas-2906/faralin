import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { ProblemTracksService } from './problem-tracks.service';

@Controller('problem-tracks')
export class ProblemTracksController {
  constructor(private tracks: ProblemTracksService) {}

  @Public()
  @Get()
  list(@Query('subject') subject?: string, @Query('difficulty') difficulty?: string) {
    return this.tracks.listTracks(subject, difficulty);
  }

  @Get('catalog/me')
  @Roles(UserRole.STUDENT)
  catalogMe(@CurrentUser() user: AuthUser, @Query('difficulty') difficulty?: string) {
    return this.tracks.listTracksForStudent(user.studentProfileId!, difficulty);
  }

  @Get('attempts/:attemptId')
  @Roles(UserRole.STUDENT)
  getAttempt(@CurrentUser() user: AuthUser, @Param('attemptId') attemptId: string) {
    return this.tracks.getAttempt(user.studentProfileId!, attemptId);
  }

  @Patch('attempts/:attemptId/steps/:sectionId')
  @Roles(UserRole.STUDENT)
  saveStep(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Param('sectionId') sectionId: string,
    @Body()
    body: {
      response: Record<string, unknown>;
      timeSpentMs?: number;
      copyPasteCount?: number;
    },
  ) {
    return this.tracks.saveStep(user.studentProfileId!, attemptId, sectionId, body);
  }

  @Post('attempts/:attemptId/steps/:sectionId/ai-feedback')
  @Roles(UserRole.STUDENT)
  aiFeedback(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: { message?: string },
  ) {
    return this.tracks.getAiFeedback(
      user.studentProfileId!,
      attemptId,
      sectionId,
      body.message,
    );
  }

  @Post('attempts/:attemptId/final-builder')
  @Roles(UserRole.STUDENT)
  finalBuilder(@CurrentUser() user: AuthUser, @Param('attemptId') attemptId: string) {
    return this.tracks.buildFinalDraft(user.studentProfileId!, attemptId);
  }

  @Post('attempts/:attemptId/submit')
  @Roles(UserRole.STUDENT)
  submit(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() body: { finalSubmission: string },
  ) {
    return this.tracks.submitAttempt(user.studentProfileId!, attemptId, body.finalSubmission);
  }

  @Public()
  @Get(':slug/full')
  getFull(@Param('slug') slug: string) {
    return this.tracks.getTrack(slug, true);
  }

  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.tracks.getTrack(slug, false);
  }

  @Post(':slug/start')
  @Roles(UserRole.STUDENT)
  start(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.tracks.startAttempt(user.studentProfileId!, slug);
  }
}

@Controller('students/portfolio')
@Roles(UserRole.STUDENT)
export class PortfolioArtifactsController {
  constructor(private tracks: ProblemTracksService) {}

  @Get('artifacts')
  listArtifacts(@CurrentUser() user: AuthUser) {
    return this.tracks.getPortfolioArtifacts(user.studentProfileId!);
  }
}

@Controller('admin/problem-tracks')
@Roles(UserRole.ADMIN)
export class AdminProblemTracksController {
  constructor(private tracks: ProblemTracksService) {}

  @Get('moderation')
  moderationQueue() {
    return this.tracks.listModerationQueue();
  }

  @Post('moderation/:attemptId')
  moderate(
    @Param('attemptId') attemptId: string,
    @Body() body: { decision: 'approve' | 'reject'; notes?: string },
  ) {
    return this.tracks.moderateAttempt(attemptId, body.decision, body.notes);
  }
}
