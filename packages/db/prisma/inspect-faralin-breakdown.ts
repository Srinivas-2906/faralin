import { PrismaClient } from '@prisma/client';

const search = process.argv[2]?.trim() ?? 'Newton';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    Array<{
      profile_id: string;
      first_name: string | null;
      last_name: string | null;
      email: string;
      university_name: string;
      university_slug: string;
      faralins: bigint;
      selection_priority: number;
    }>
  >`
    SELECT
      sp.id AS profile_id,
      sp."firstName" AS first_name,
      sp."lastName" AS last_name,
      u.email,
      uni.name AS university_name,
      uni.slug AS university_slug,
      COALESCE(SUM(ft.amount), 0) AS faralins,
      sus.priority AS selection_priority
    FROM "StudentProfile" sp
    JOIN "User" u ON u.id = sp."userId"
    JOIN "StudentUniversitySelection" sus ON sus."studentProfileId" = sp.id
    JOIN "University" uni ON uni.id = sus."universityId"
    LEFT JOIN "FaralinTransaction" ft
      ON ft."studentProfileId" = sp.id
      AND ft."universityId" = uni.id
      AND ft.status IN ('CONDITIONAL', 'CONFIRMED', 'CONVERTED')
    WHERE sp."firstName" ILIKE ${'%' + search + '%'}
       OR sp."lastName" ILIKE ${'%' + search + '%'}
    GROUP BY sp.id, sp."firstName", sp."lastName", u.email, uni.name, uni.slug, sus.priority
    ORDER BY sp.id, sus.priority
  `;

  if (!rows.length) {
    console.log(JSON.stringify({ message: `No student profile matching "${search}"` }, null, 2));
    return;
  }

  const profileId = rows[0].profile_id;
  const assessmentAttempts = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "AssessmentAttempt"
    WHERE "studentProfileId" = ${profileId}
      AND "completedAt" IS NOT NULL
      AND "isVoided" = false
  `;

  const byUniversity = rows
    .filter((row) => row.profile_id === profileId)
    .map((row) => ({
      university: { name: row.university_name, slug: row.university_slug },
      priority: row.selection_priority,
      faralins: Number(row.faralins),
    }));

  const totalFaralins = byUniversity.reduce((sum, row) => sum + row.faralins, 0);

  console.log(
    JSON.stringify(
      {
        profileId,
        name: [rows[0].first_name, rows[0].last_name].filter(Boolean).join(' '),
        email: rows[0].email,
        assessmentAttempts: Number(assessmentAttempts[0]?.count ?? 0),
        totalFaralins,
        byUniversity,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
