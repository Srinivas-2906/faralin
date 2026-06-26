import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApplicationStatus, UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApplicationsService } from './applications.service';

@Controller('applications')
export class ApplicationsController {
  constructor(private applications: ApplicationsService) {}

  @Get('me')
  @Roles(UserRole.STUDENT)
  listMine(@CurrentUser() user: AuthUser) {
    return this.applications.listApplications(user.studentProfileId!);
  }

  @Post(':universitySlug/referral')
  @Roles(UserRole.STUDENT)
  trackReferral(@CurrentUser() user: AuthUser, @Param('universitySlug') universitySlug: string) {
    return this.applications.trackReferralClick(user.studentProfileId!, universitySlug);
  }

  @Patch('staff/:studentProfileId/status')
  @Roles(UserRole.UNIVERSITY_STAFF)
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('studentProfileId') studentProfileId: string,
    @Body() body: { status: ApplicationStatus },
  ) {
    return this.applications.updateApplicationStatus(
      user.universityId!,
      studentProfileId,
      body.status,
    );
  }
}
