import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AssessmentsService } from './assessments.service';
import { Public } from '../auth/public.decorator';

@Controller('assessments')
export class AssessmentsController {
  constructor(private assessments: AssessmentsService) {}

  @Public()
  @Get()
  list(@Query('subject') subject?: string) {
    return this.assessments.listAssessments(subject);
  }

  @Get('history/me')
  @Roles(UserRole.STUDENT)
  history(@CurrentUser() user: AuthUser) {
    return this.assessments.getAttemptHistory(user.studentProfileId!);
  }

  @Public()
  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.assessments.getAssessment(slug);
  }

  @Post(':slug/start')
  @Roles(UserRole.STUDENT)
  start(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.assessments.startAttempt(user.studentProfileId!, slug);
  }

  @Post('attempts/:attemptId/submit')
  @Roles(UserRole.STUDENT)
  submit(
    @CurrentUser() user: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() body: { answers: Array<{ questionId: string; response: unknown; writtenExplanation?: string }> },
  ) {
    return this.assessments.submitAttempt(user.studentProfileId!, attemptId, body.answers);
  }
}
