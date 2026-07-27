import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus } from '@faralin/db';
import { mapStudentWithProfile } from '../auth/auth-user.service';
import { AwardAccountService } from '../faralin/award-account.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  APPLICATION_STATUS_LABELS,
  getPerformanceBand,
} from '../universities/staff-roster';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private awardAccountService: AwardAccountService,
  ) {}

  async trackReferralClick(studentProfileId: string, universitySlug: string) {
    const university = await this.prisma.university.findUnique({
      where: { slug: universitySlug },
    });

    if (!university) throw new NotFoundException('University not found');

    const isFollowing = await this.prisma.studentUniversitySelection.findFirst({
      where: { studentProfileId, universityId: university.id },
    });

    if (!isFollowing) {
      throw new BadRequestException('You must follow this university before applying');
    }

    await this.awardAccountService.applyApplicationStatus(
      studentProfileId,
      university.id,
      ApplicationStatus.REFERRAL_CLICKED,
    );

    const application = await this.prisma.application.upsert({
      where: {
        studentProfileId_universityId: {
          studentProfileId,
          universityId: university.id,
        },
      },
      create: {
        studentProfileId,
        universityId: university.id,
        status: ApplicationStatus.REFERRAL_CLICKED,
        referralClickedAt: new Date(),
        externalUrl: university.applyUrl ?? university.websiteUrl,
      },
      update: {
        status: ApplicationStatus.REFERRAL_CLICKED,
        referralClickedAt: new Date(),
        externalUrl: university.applyUrl ?? university.websiteUrl,
      },
    });

    return {
      application,
      redirectUrl: university.applyUrl ?? university.websiteUrl,
    };
  }

  async listApplications(studentProfileId: string) {
    return this.prisma.application.findMany({
      where: { studentProfileId },
      include: { university: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listStaffApplications(universityId: string) {
    const [applications, faralinTotals] = await Promise.all([
      this.prisma.application.findMany({
        where: { universityId },
        include: {
          studentProfile: {
            include: {
              subjects: { include: { subject: true } },
              assessmentAttempts: { where: { completedAt: { not: null }, isVoided: false } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.faralinTransaction.groupBy({
        by: ['studentProfileId'],
        where: { universityId },
        _sum: { amount: true },
      }),
    ]);

    const faralinByStudent = Object.fromEntries(
      faralinTotals.map((row) => [row.studentProfileId, row._sum.amount ?? 0]),
    );

    return applications.map((application) => {
      const profile = application.studentProfile;
      const totalFaralins = faralinByStudent[profile.id] ?? 0;
      const assessmentsCompleted = profile.assessmentAttempts.length;
      const studentView = mapStudentWithProfile(profile, {
        subjectSlugs: profile.subjects.map((s) => s.subject.slug),
        assessmentsCompleted,
        totalFaralins,
        performanceBand: getPerformanceBand(totalFaralins, assessmentsCompleted),
      });

      return {
        id: application.id,
        studentProfileId: application.studentProfileId,
        anonymousId: studentView.anonymousId,
        displayName:
          studentView.firstName || studentView.lastName
            ? [studentView.firstName, studentView.lastName].filter(Boolean).join(' ')
            : studentView.anonymousId,
        status: application.status,
        pipelineLabel: APPLICATION_STATUS_LABELS[application.status] ?? application.status,
        subjectNames: profile.subjects.map((s) => s.subject.name),
        totalFaralins,
        performanceBand: getPerformanceBand(totalFaralins, assessmentsCompleted),
        referralClickedAt: application.referralClickedAt,
        appliedAt: application.appliedAt,
        offerReceivedAt: application.offerReceivedAt,
        offerAcceptedAt: application.offerAcceptedAt,
        enrolledAt: application.enrolledAt,
        updatedAt: application.updatedAt,
      };
    });
  }

  async updateApplicationStatus(
    universityId: string,
    studentProfileId: string,
    status: ApplicationStatus,
  ) {
    const application = await this.prisma.application.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    // Validate funnel limits / run enrolment forfeiture before persisting status
    await this.awardAccountService.applyApplicationStatus(
      studentProfileId,
      universityId,
      status,
    );

    const timestamps: Record<string, Date> = { updatedAt: new Date() };
    if (status === ApplicationStatus.APPLIED) timestamps.appliedAt = new Date();
    if (status === ApplicationStatus.OFFER_RECEIVED) timestamps.offerReceivedAt = new Date();
    if (
      status === ApplicationStatus.OFFER_ACCEPTED ||
      status === ApplicationStatus.FIRM ||
      status === ApplicationStatus.INSURANCE
    ) {
      timestamps.offerAcceptedAt = new Date();
    }
    if (status === ApplicationStatus.ENROLLED) timestamps.enrolledAt = new Date();

    return this.prisma.application.update({
      where: { id: application.id },
      data: { status, ...timestamps },
    });
  }
}
