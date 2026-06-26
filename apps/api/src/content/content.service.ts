import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ArticleType, EventType } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async listSubjects() {
    return this.prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async createArticle(
    universityId: string,
    data: {
      type: ArticleType;
      title: string;
      slug: string;
      excerpt?: string;
      content: string;
      subjectTags?: string[];
      isPublished?: boolean;
    },
  ) {
    return this.prisma.article.create({
      data: {
        universityId,
        ...data,
        publishedAt: data.isPublished ? new Date() : null,
      },
    });
  }

  async updateArticle(
    universityId: string,
    articleId: string,
    data: Partial<{
      type: ArticleType;
      title: string;
      excerpt: string;
      content: string;
      subjectTags: string[];
      isPublished: boolean;
    }>,
  ) {
    const article = await this.prisma.article.findFirst({
      where: { id: articleId, universityId },
    });
    if (!article) throw new NotFoundException('Article not found');

    return this.prisma.article.update({
      where: { id: articleId },
      data: {
        ...data,
        publishedAt: data.isPublished ? (article.publishedAt ?? new Date()) : null,
      },
    });
  }

  async createEvent(
    universityId: string,
    data: {
      type: EventType;
      title: string;
      description?: string;
      startsAt: string;
      endsAt?: string;
      externalUrl?: string;
      capacity?: number;
      isPublished?: boolean;
    },
  ) {
    return this.prisma.event.create({
      data: {
        universityId,
        type: data.type,
        title: data.title,
        description: data.description,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        externalUrl: data.externalUrl,
        capacity: data.capacity,
        isPublished: data.isPublished ?? false,
      },
    });
  }

  async registerForEvent(studentProfileId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { registrations: true },
    });

    if (!event || !event.isPublished) {
      throw new NotFoundException('Event not found');
    }

    const isFollowing = await this.prisma.studentUniversitySelection.findFirst({
      where: { studentProfileId, universityId: event.universityId },
    });

    if (!isFollowing) {
      throw new ForbiddenException('You must follow this university to register');
    }

    if (event.capacity && event.registrations.length >= event.capacity) {
      throw new ForbiddenException('Event is at capacity');
    }

    return this.prisma.eventRegistration.upsert({
      where: {
        eventId_studentProfileId: { eventId, studentProfileId },
      },
      create: { eventId, studentProfileId },
      update: {},
    });
  }

  async listUniversityArticles(universityId: string) {
    return this.prisma.article.findMany({
      where: { universityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listUniversityEvents(universityId: string) {
    return this.prisma.event.findMany({
      where: { universityId },
      include: { registrations: true },
      orderBy: { startsAt: 'asc' },
    });
  }
}
