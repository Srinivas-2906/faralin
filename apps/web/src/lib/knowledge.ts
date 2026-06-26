const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface KnowledgeArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  type: string;
  subjectTags: string[];
  publishedAt: string | null;
  university: {
    slug: string;
    shortName: string | null;
    name: string;
  };
}

export interface KnowledgeArticleDetail extends KnowledgeArticleListItem {
  content: string;
}

export interface CourseListItem {
  slug: string;
  title: string;
  subtitle: string | null;
  instructorName: string;
  level: string;
  durationMinutes: number;
  thumbnailUrl: string | null;
  subjectTags: string[];
  lessonCount: number;
  sectionCount: number;
}

export interface CourseLessonSummary {
  id: string;
  title: string;
  sortOrder: number;
  durationSeconds: number;
  isPreviewFree: boolean;
}

export interface CourseDetail {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  learningOutcomes: string[];
  instructorName: string;
  level: string;
  durationMinutes: number;
  thumbnailUrl: string | null;
  subjectTags: string[];
  lessonCount: number;
  sections: {
    id: string;
    title: string;
    sortOrder: number;
    lessons: CourseLessonSummary[];
  }[];
}

export interface CourseLearnData {
  slug: string;
  title: string;
  sections: {
    id: string;
    title: string;
    sortOrder: number;
    lessons: {
      id: string;
      title: string;
      sortOrder: number;
      durationSeconds: number;
      videoUrl: string;
      isPreviewFree: boolean;
    }[];
  }[];
  activeLessonId: string;
}

export interface CourseProgress {
  completedLessonIds: string[];
  lastPositions: Record<string, number>;
  percentComplete: number;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: 'no-store', ...init });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getKnowledgeArticles(type?: 'blog' | 'news', subject?: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (subject) params.set('subject', subject);
  const query = params.toString();
  return (await fetchJson<KnowledgeArticleListItem[]>(
    `/api/knowledge/articles${query ? `?${query}` : ''}`,
  )) ?? [];
}

export async function getKnowledgeArticle(slug: string) {
  return fetchJson<KnowledgeArticleDetail>(`/api/knowledge/articles/${slug}`);
}

export async function getCourses() {
  return (await fetchJson<CourseListItem[]>('/api/knowledge/courses')) ?? [];
}

export async function getCourse(slug: string) {
  return fetchJson<CourseDetail>(`/api/knowledge/courses/${slug}`);
}

export async function getCourseLearn(slug: string, lessonId?: string) {
  const query = lessonId ? `?lesson=${encodeURIComponent(lessonId)}` : '';
  return fetchJson<CourseLearnData>(`/api/knowledge/courses/${slug}/learn${query}`);
}

export function formatDurationMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatLessonDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
