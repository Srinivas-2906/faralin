import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { KnowledgeService } from './knowledge.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private knowledge: KnowledgeService) {}

  @Public()
  @Get('articles')
  listArticles(@Query('type') type?: string, @Query('subject') subject?: string) {
    return this.knowledge.listArticles(type, subject);
  }

  @Public()
  @Get('articles/:slug')
  getArticle(@Param('slug') slug: string) {
    return this.knowledge.getArticleBySlug(slug);
  }

  @Public()
  @Get('courses')
  listCourses() {
    return this.knowledge.listCourses();
  }

  @Public()
  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string) {
    return this.knowledge.getCourseBySlug(slug);
  }

  @Public()
  @Get('courses/:slug/learn')
  getCourseLearn(@Param('slug') slug: string, @Query('lesson') lessonId?: string) {
    return this.knowledge.getCourseForLearn(slug, lessonId);
  }

  @Get('courses/:slug/progress')
  @Roles(UserRole.STUDENT)
  getCourseProgress(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.knowledge.getCourseProgress(user.studentProfileId!, slug);
  }

  @Post('courses/:slug/progress')
  @Roles(UserRole.STUDENT)
  upsertCourseProgress(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body()
    body: {
      lessonId: string;
      completed?: boolean;
      lastPositionSeconds?: number;
    },
  ) {
    return this.knowledge.upsertCourseProgress(user.studentProfileId!, slug, body);
  }
}
