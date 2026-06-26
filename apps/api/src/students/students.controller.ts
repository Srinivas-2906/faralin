import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { StudentsService } from './students.service';

@Controller('students')
@Roles(UserRole.STUDENT)
export class StudentsController {
  constructor(private students: StudentsService) {}

  private requireProfile(user: AuthUser): string {
    if (!user.studentProfileId) {
      throw new ForbiddenException('Student profile required');
    }
    return user.studentProfileId;
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.students.getProfile(this.requireProfile(user));
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      schoolName?: string;
      yearGroup?: number;
      onboardingComplete?: boolean;
    },
  ) {
    return this.students.updateProfile(this.requireProfile(user), body);
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthUser) {
    return this.students.getDashboard(this.requireProfile(user));
  }

  @Get('portfolio')
  getPortfolio(@CurrentUser() user: AuthUser) {
    return this.students.getPortfolio(this.requireProfile(user));
  }

  @Get('universities')
  listUniversities() {
    return this.students.listUniversities();
  }

  @Post('universities/select')
  selectUniversities(
    @CurrentUser() user: AuthUser,
    @Body() body: { universityIds: string[] },
  ) {
    return this.students.selectUniversities(this.requireProfile(user), body.universityIds);
  }

  @Post('subjects/select')
  setSubjects(
    @CurrentUser() user: AuthUser,
    @Body() body: { subjectIds: string[] },
  ) {
    return this.students.setSubjects(this.requireProfile(user), body.subjectIds);
  }
}
