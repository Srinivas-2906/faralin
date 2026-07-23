import { AssessmentCategory, PrismaClient } from '@prisma/client';
import {
  assessmentSeriesDefs,
  assessmentTemplateDefs,
} from './data/assessment-templates';
import { universityDefs } from './data/universities';
import { buildAssessmentRule, getTierEconomics } from '@faralin/types';

const prisma = new PrismaClient();

const CO_CURRICULAR_SUBJECT = { slug: 'co-curricular', name: 'Co-curricular Skills' };

async function ensureCoCurricularSubject() {
  return prisma.subject.upsert({
    where: { slug: CO_CURRICULAR_SUBJECT.slug },
    create: CO_CURRICULAR_SUBJECT,
    update: { name: CO_CURRICULAR_SUBJECT.name, isActive: true },
  });
}

async function upsertTemplateAssessment(subjectId: string, def: (typeof assessmentTemplateDefs)[number]) {
  const { questions, subjectSlug: _subjectSlug, category, seriesSlug, levelOrder, ...assessmentData } = def;
  const assessment = await prisma.assessment.upsert({
    where: { slug: def.slug },
    create: {
      ...assessmentData,
      category,
      seriesSlug: seriesSlug ?? null,
      levelOrder: levelOrder ?? null,
      subjectId,
    },
    update: {
      title: assessmentData.title,
      description: assessmentData.description,
      category,
      seriesSlug: seriesSlug ?? null,
      levelOrder: levelOrder ?? null,
      estimatedFaralinMin: assessmentData.estimatedFaralinMin,
      estimatedFaralinMax: assessmentData.estimatedFaralinMax,
    },
  });

  const existingQuestions = await prisma.assessmentQuestion.count({
    where: { assessmentId: assessment.id },
  });
  if (existingQuestions === 0) {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await prisma.assessmentQuestion.create({
        data: {
          assessmentId: assessment.id,
          sortOrder: i + 1,
          prompt: q.prompt,
          questionType: q.questionType,
          options: q.options ?? undefined,
          correctAnswer: q.correctAnswer,
        },
      });
    }
  }

  return assessment;
}

async function upsertTemplateAssessments(subjectId: string) {
  let created = 0;
  for (const def of assessmentTemplateDefs) {
    const before = await prisma.assessment.findUnique({ where: { slug: def.slug } });
    await upsertTemplateAssessment(subjectId, def);
    if (!before) created++;
  }
  return created;
}

async function backfillSeriesUnlocks() {
  let updated = 0;
  const assessments = await prisma.assessment.findMany({
    where: { seriesSlug: { not: null }, levelOrder: { not: null } },
    select: { id: true, seriesSlug: true, levelOrder: true },
  });

  const bySeries = new Map<string, typeof assessments>();
  for (const a of assessments) {
    if (!a.seriesSlug || a.levelOrder == null) continue;
    const list = bySeries.get(a.seriesSlug) ?? [];
    list.push(a);
    bySeries.set(a.seriesSlug, list);
  }

  for (const series of assessmentSeriesDefs) {
    const levels = [...(bySeries.get(series.seriesSlug) ?? [])].sort(
      (a, b) => (a.levelOrder ?? 0) - (b.levelOrder ?? 0),
    );
    for (let i = 1; i < levels.length; i++) {
      const prev = levels[i - 1];
      const current = levels[i];
      const result = await prisma.universityAssessmentConfig.updateMany({
        where: { assessmentId: current.id, unlocksAfterAssessmentId: null },
        data: { unlocksAfterAssessmentId: prev.id },
      });
      updated += result.count;
    }
  }

  return updated;
}

async function ensureAssessmentRule(universityId: string, assessmentId: string, slug: string) {
  const existing = await prisma.faralinRule.findFirst({
    where: {
      universityId,
      assessmentId,
      subjectId: null,
      problemTrackId: null,
    },
  });
  if (existing) return false;

  const economics = getTierEconomics(slug);
  const assessmentRule = buildAssessmentRule(economics);
  await prisma.faralinRule.create({
    data: {
      universityId,
      assessmentId,
      ...assessmentRule,
    },
  });
  return true;
}

async function ensureAssessmentConfig(
  universityId: string,
  assessmentId: string,
  enabled: boolean,
) {
  await prisma.universityAssessmentConfig.upsert({
    where: {
      universityId_assessmentId: { universityId, assessmentId },
    },
    create: {
      universityId,
      assessmentId,
      enabled,
    },
    update: {},
  });
}

async function ensureTrackConfig(universityId: string, problemTrackId: string, enabled: boolean) {
  await prisma.universityProblemTrackConfig.upsert({
    where: {
      universityId_problemTrackId: { universityId, problemTrackId },
    },
    create: {
      universityId,
      problemTrackId,
      enabled,
    },
    update: {},
  });
}

async function main() {
  console.log('Backfilling university assessment and track configs…');

  const subject = await ensureCoCurricularSubject();
  const templatesCreated = await upsertTemplateAssessments(subject.id);
  console.log(`Template assessments created: ${templatesCreated}`);

  const unlocksUpdated = await backfillSeriesUnlocks();
  console.log(`Series unlock configs updated: ${unlocksUpdated}`);

  const assessments = await prisma.assessment.findMany({
    select: { id: true, category: true },
  });
  const tracks = await prisma.problemTrack.findMany({ select: { id: true } });
  const universities = await prisma.university.findMany({
    where: { slug: { in: universityDefs.map((u) => u.slug) } },
  });

  let configsCreated = 0;
  let rulesCreated = 0;
  let trackConfigsCreated = 0;

  for (const university of universities) {
    for (const assessment of assessments) {
      const enabled = assessment.category === AssessmentCategory.ACADEMIC_SUBJECT;
      const before = await prisma.universityAssessmentConfig.findUnique({
        where: {
          universityId_assessmentId: {
            universityId: university.id,
            assessmentId: assessment.id,
          },
        },
      });
      if (!before) configsCreated++;
      await ensureAssessmentConfig(university.id, assessment.id, enabled);

      if (await ensureAssessmentRule(university.id, assessment.id, university.slug)) {
        rulesCreated++;
      }
    }

    for (const track of tracks) {
      const before = await prisma.universityProblemTrackConfig.findUnique({
        where: {
          universityId_problemTrackId: {
            universityId: university.id,
            problemTrackId: track.id,
          },
        },
      });
      if (!before) trackConfigsCreated++;
      await ensureTrackConfig(university.id, track.id, true);
    }
  }

  console.log(`University assessment configs ensured: ${configsCreated} new`);
  console.log(`Assessment Faralin rules created: ${rulesCreated}`);
  console.log(`Track configs ensured: ${trackConfigsCreated} new`);
  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
