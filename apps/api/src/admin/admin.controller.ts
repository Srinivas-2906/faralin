import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private admin: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.admin.getOverview();
  }

  @Get('assessments')
  listAssessments() {
    return this.admin.listAssessments();
  }

  @Post('assessments')
  createAssessment(@Body() body: Parameters<AdminService['createAssessment']>[0]) {
    return this.admin.createAssessment(body);
  }

  @Patch('assessments/:id')
  updateAssessment(
    @Param('id') id: string,
    @Body() body: Parameters<AdminService['updateAssessment']>[1],
  ) {
    return this.admin.updateAssessment(id, body);
  }

  @Get('faralin-rules')
  listFaralinRules() {
    return this.admin.listFaralinRules();
  }

  @Post('faralin-rules')
  createFaralinRule(@Body() body: Parameters<AdminService['createFaralinRule']>[0]) {
    return this.admin.createFaralinRule(body);
  }

  @Patch('faralin-rules/:id')
  updateFaralinRule(
    @Param('id') id: string,
    @Body() body: Parameters<AdminService['updateFaralinRule']>[1],
  ) {
    return this.admin.updateFaralinRule(id, body);
  }

  @Get('universities')
  listUniversities() {
    return this.admin.listUniversities();
  }

  @Post('universities')
  createUniversity(@Body() body: Parameters<AdminService['createUniversity']>[0]) {
    return this.admin.createUniversity(body);
  }

  @Get('subjects')
  listSubjects() {
    return this.admin.listSubjects();
  }

  @Post('subjects')
  createSubject(@Body() body: Parameters<AdminService['createSubject']>[0]) {
    return this.admin.createSubject(body);
  }
}
