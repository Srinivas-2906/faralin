import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@faralin/db';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { AuthUser } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private content: ContentService) {}

  @Public()
  @Get('subjects')
  listSubjects() {
    return this.content.listSubjects();
  }

  @Post('events/:eventId/register')
  @Roles(UserRole.STUDENT)
  registerForEvent(@CurrentUser() user: AuthUser, @Param('eventId') eventId: string) {
    return this.content.registerForEvent(user.studentProfileId!, eventId);
  }

  @Get('staff/articles')
  @Roles(UserRole.UNIVERSITY_STAFF)
  listArticles(@CurrentUser() user: AuthUser) {
    return this.content.listUniversityArticles(user.universityId!);
  }

  @Post('staff/articles')
  @Roles(UserRole.UNIVERSITY_STAFF)
  createArticle(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      type: import('@faralin/db').ArticleType;
      title: string;
      slug: string;
      excerpt?: string;
      content: string;
      subjectTags?: string[];
      isPublished?: boolean;
    },
  ) {
    return this.content.createArticle(user.universityId!, body);
  }

  @Patch('staff/articles/:id')
  @Roles(UserRole.UNIVERSITY_STAFF)
  updateArticle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      type: import('@faralin/db').ArticleType;
      title: string;
      excerpt: string;
      content: string;
      subjectTags: string[];
      isPublished: boolean;
    }>,
  ) {
    return this.content.updateArticle(user.universityId!, id, body);
  }

  @Get('staff/events')
  @Roles(UserRole.UNIVERSITY_STAFF)
  listEvents(@CurrentUser() user: AuthUser) {
    return this.content.listUniversityEvents(user.universityId!);
  }

  @Post('staff/events')
  @Roles(UserRole.UNIVERSITY_STAFF)
  createEvent(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      type: import('@faralin/db').EventType;
      title: string;
      description?: string;
      startsAt: string;
      endsAt?: string;
      externalUrl?: string;
      capacity?: number;
      isPublished?: boolean;
    },
  ) {
    return this.content.createEvent(user.universityId!, body);
  }
}
