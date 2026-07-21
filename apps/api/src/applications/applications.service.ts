import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApplicationStatus, FaralinTransactionStatus } from '@faralin/db';
import { mapStudentWithProfile } from '../auth/auth-user.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

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
    const applications = await this.prisma.application.findMany({
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
    });

    return applications.map((application) => {
      const profile = application.studentProfile;
      const studentView = mapStudentWithProfile(profile, {
        subjectSlugs: profile.subjects.map((s) => s.subject.slug),
        assessmentsCompleted: profile.assessmentAttempts.length,
        totalFaralins: 0,
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

    const timestamps: Record<string, Date> = { updatedAt: new Date() };
    if (status === ApplicationStatus.APPLIED) timestamps.appliedAt = new Date();
    if (status === ApplicationStatus.OFFER_RECEIVED) timestamps.offerReceivedAt = new Date();
    if (status === ApplicationStatus.OFFER_ACCEPTED) timestamps.offerAcceptedAt = new Date();
    if (status === ApplicationStatus.ENROLLED) timestamps.enrolledAt = new Date();

    const updated = await this.prisma.application.update({
      where: { id: application.id },
      data: { status, ...timestamps },
    });

    if (status === ApplicationStatus.ENROLLED) {
      await this.prisma.faralinTransaction.updateMany({
        where: {
          studentProfileId,
          universityId,
          status: FaralinTransactionStatus.CONDITIONAL,
        },
        data: { status: FaralinTransactionStatus.CONFIRMED },
      });
    }

    return updated;
  }
}
