import { ProfileRevealLevel, UserRole } from '@faralin/db';
import { PrismaService } from '../prisma/prisma.service';
import { toStaffStudentView } from '../students/student-view.mapper';

export function generateAnonymousId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${letter}${num}`;
}

export function pendingClerkUserId(): string {
  return `pending_${crypto.randomUUID().replace(/-/g, '')}`;
}

export async function linkPendingStaffUser(
  prisma: PrismaService,
  clerkUserId: string,
  email: string,
) {
  const pendingStaff = await prisma.user.findFirst({
    where: {
      email,
      role: UserRole.UNIVERSITY_STAFF,
      clerkUserId: { startsWith: 'pending_' },
    },
    include: {
      studentProfile: true,
      universityStaffProfile: true,
    },
  });

  if (!pendingStaff) return null;

  return prisma.user.update({
    where: { id: pendingStaff.id },
    data: { clerkUserId },
    include: {
      studentProfile: true,
      universityStaffProfile: true,
    },
  });
}

export async function linkStaffUserByEmail(
  prisma: PrismaService,
  clerkUserId: string,
  email: string,
) {
  const staff = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      role: UserRole.UNIVERSITY_STAFF,
    },
    include: {
      studentProfile: true,
      universityStaffProfile: true,
    },
  });

  if (!staff) return null;

  const duplicate = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (duplicate && duplicate.id !== staff.id) {
    await prisma.user.delete({ where: { id: duplicate.id } });
  }

  if (staff.clerkUserId === clerkUserId) {
    return staff;
  }

  return prisma.user.update({
    where: { id: staff.id },
    data: { clerkUserId },
    include: {
      studentProfile: true,
      universityStaffProfile: true,
    },
  });
}

export async function findOrCreateUserFromClerk(
  prisma: PrismaService,
  clerkUserId: string,
  email?: string,
) {
  let user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      studentProfile: true,
      universityStaffProfile: true,
    },
  });

  if (!user && email) {
    user = await linkPendingStaffUser(prisma, clerkUserId, email);
  }

  if (!user && email) {
    user = await linkStaffUserByEmail(prisma, clerkUserId, email);
  }

  if (user?.role === UserRole.STUDENT && email) {
    const staffUser = await linkStaffUserByEmail(prisma, clerkUserId, email);
    if (staffUser) {
      user = staffUser;
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: email ?? `user-${clerkUserId.slice(-8)}@faralin.local`,
        role: UserRole.STUDENT,
        studentProfile: {
          create: {
            anonymousId: generateAnonymousId(),
          },
        },
      },
      include: {
        studentProfile: true,
        universityStaffProfile: true,
      },
    });
  }

  return user;
}

export function mapStudentWithProfile(
  profile: {
    anonymousId: string;
    revealLevel: ProfileRevealLevel;
    firstName: string | null;
    lastName: string | null;
    schoolName: string | null;
    yearGroup: number | null;
  },
  extras: {
    subjectSlugs: string[];
    assessmentsCompleted: number;
    totalFaralins: number;
    performanceBand?: string;
  },
) {
  return toStaffStudentView({
    anonymousId: profile.anonymousId,
    revealLevel: profile.revealLevel,
    firstName: profile.firstName,
    lastName: profile.lastName,
    schoolName: profile.schoolName,
    yearGroup: profile.yearGroup,
    ...extras,
  });
}
