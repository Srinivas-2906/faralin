import { AssessmentCategory, PrismaClient } from '@prisma/client';
import { assessmentTemplateDefs } from './data/assessment-templates';
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

async function upsertTemplateAssessments(subjectId: string) {
  let created = 0;
  for (const def of assessmentTemplateDefs) {
    const { questions, subjectSlug: _subjectSlug, category, ...assessmentData } = def;
    const existing = await prisma.assessment.findUnique({ where: { slug: def.slug } });
    if (existing) continue;

    const assessment = await prisma.assessment.create({
      data: {
        ...assessmentData,
        category,
        subjectId,
      },
    });

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
    created++;
  }
  return created;
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
