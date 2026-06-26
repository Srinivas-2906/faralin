import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleType } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';

const articleListSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  type: true,
  subjectTags: true,
  publishedAt: true,
  university: {
    select: {
      slug: true,
      shortName: true,
      name: true,
    },
  },
} as const;

@Injectable()
export class KnowledgeService {
  constructor(private prisma: PrismaService) {}

  private parseArticleType(type?: string): ArticleType | undefined {
    if (!type) return undefined;
    const normalized = type.toUpperCase();
    if (normalized === 'BLOG') return ArticleType.BLOG;
    if (normalized === 'NEWS') return ArticleType.NEWS;
    return undefined;
  }

  async listArticles(type?: string, subject?: string) {
    const articleType = this.parseArticleType(type);
    const where = {
      isPublished: true,
      ...(articleType ? { type: articleType } : {}),
      ...(subject ? { subjectTags: { has: subject } } : {}),
    };

    return this.prisma.article.findMany({
      where,
      select: articleListSelect,
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getArticleBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, isPublished: true },
      include: {
        university: {
          select: {
            slug: true,
            shortName: true,
            name: true,
          },
        },
      },
    });

    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async listCourses() {
    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      include: {
        sections: {
          include: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return courses.map((course) => ({
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      instructorName: course.instructorName,
      level: course.level,
      durationMinutes: course.durationMinutes,
      thumbnailUrl: course.thumbnailUrl,
      subjectTags: course.subjectTags,
      lessonCount: course.sections.reduce((sum, section) => sum + section._count.lessons, 0),
      sectionCount: course.sections.length,
    }));
  }

  async getCourseBySlug(slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                title: true,
                sortOrder: true,
                durationSeconds: true,
                isPreviewFree: true,
              },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const lessonCount = course.sections.reduce(
      (sum, section) => sum + section.lessons.length,
      0,
    );

    return {
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      learningOutcomes: course.learningOutcomes,
      instructorName: course.instructorName,
      level: course.level,
      durationMinutes: course.durationMinutes,
      thumbnailUrl: course.thumbnailUrl,
      subjectTags: course.subjectTags,
      lessonCount,
      sections: course.sections.map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        lessons: section.lessons,
      })),
    };
  }

  async getCourseForLearn(slug: string, lessonId?: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            lessons: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const allLessons = course.sections.flatMap((section) => section.lessons);
    const activeLesson =
      allLessons.find((lesson) => lesson.id === lessonId) ??
      allLessons.find((lesson) => lesson.isPreviewFree) ??
      allLessons[0];

    if (!activeLesson) throw new NotFoundException('No lessons in this course');

    return {
      slug: course.slug,
      title: course.title,
      sections: course.sections.map((section) => ({
        id: section.id,
        title: section.title,
        sortOrder: section.sortOrder,
        lessons: section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          sortOrder: lesson.sortOrder,
          durationSeconds: lesson.durationSeconds,
          videoUrl: lesson.videoUrl,
          isPreviewFree: lesson.isPreviewFree,
        })),
      })),
      activeLessonId: activeLesson.id,
    };
  }

  async getCourseProgress(studentProfileId: string, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: {
          include: { lessons: { select: { id: true } } },
        },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const lessonIds = course.sections.flatMap((section) =>
      section.lessons.map((lesson) => lesson.id),
    );

    const progress = await this.prisma.courseLessonProgress.findMany({
      where: {
        studentProfileId,
        lessonId: { in: lessonIds },
      },
    });

    const completedLessonIds = progress
      .filter((entry) => entry.completedAt)
      .map((entry) => entry.lessonId);

    const lastPositions = Object.fromEntries(
      progress.map((entry) => [entry.lessonId, entry.lastPositionSeconds]),
    );

    const totalLessons = lessonIds.length;
    const percentComplete =
      totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0;

    return {
      completedLessonIds,
      lastPositions,
      percentComplete,
    };
  }

  async upsertCourseProgress(
    studentProfileId: string,
    slug: string,
    data: {
      lessonId: string;
      completed?: boolean;
      lastPositionSeconds?: number;
    },
  ) {
    const course = await this.prisma.course.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: { include: { lessons: { select: { id: true } } } },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    const lessonIds = new Set(
      course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)),
    );

    if (!lessonIds.has(data.lessonId)) {
      throw new NotFoundException('Lesson not found in this course');
    }

    const existing = await this.prisma.courseLessonProgress.findUnique({
      where: {
        studentProfileId_lessonId: {
          studentProfileId,
          lessonId: data.lessonId,
        },
      },
    });

    return this.prisma.courseLessonProgress.upsert({
      where: {
        studentProfileId_lessonId: {
          studentProfileId,
          lessonId: data.lessonId,
        },
      },
      create: {
        studentProfileId,
        lessonId: data.lessonId,
        completedAt: data.completed ? new Date() : null,
        lastPositionSeconds: data.lastPositionSeconds ?? 0,
      },
      update: {
        completedAt: data.completed
          ? new Date()
          : existing?.completedAt ?? null,
        lastPositionSeconds:
          data.lastPositionSeconds ?? existing?.lastPositionSeconds ?? 0,
      },
    });
  }
}
