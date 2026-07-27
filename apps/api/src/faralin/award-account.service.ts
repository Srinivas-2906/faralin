import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ApplicationStatus,
  FaralinTransactionStatus,
  UniversityAwardAccountStatus,
} from '@faralin/db';
import {
  AWARD_ACCOUNT_ACTIVE_STATUSES,
  PLATFORM_LIMITS,
  awardStatusForApplicationStatus,
  isFaralinActiveApplicationStatus,
  isOfferStageApplicationStatus,
} from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AwardAccountService {
  constructor(private prisma: PrismaService) {}

  /**
   * Keep Layer 3 accounts aligned with Layer 2 projections for followed universities.
   * Does not demote RESERVED/CONFIRMED/CONVERTED/FORFEITED accounts.
   */
  async syncFromProjections(studentProfileId: string): Promise<void> {
    const projections = await this.prisma.universityProjection.findMany({
      where: { studentProfileId },
    });
    const projectionUniversityIds = new Set(projections.map((p) => p.universityId));

    for (const projection of projections) {
      const existing = await this.prisma.universityAwardAccount.findUnique({
        where: {
          studentProfileId_universityId: {
            studentProfileId,
            universityId: projection.universityId,
          },
        },
      });

      if (!existing) {
        await this.prisma.universityAwardAccount.create({
          data: {
            studentProfileId,
            universityId: projection.universityId,
            status: UniversityAwardAccountStatus.PROJECTED,
            eligibleCoreFaralins: projection.eligibleCoreFaralins,
            projectedAwardGbp: projection.estimatedAwardGbp,
          },
        });
        continue;
      }

      const terminalOrLocked: UniversityAwardAccountStatus[] = [
        UniversityAwardAccountStatus.RESERVED,
        UniversityAwardAccountStatus.CONFIRMED,
        UniversityAwardAccountStatus.CONVERTED,
        UniversityAwardAccountStatus.FORFEITED,
        UniversityAwardAccountStatus.EXPIRED,
      ];

      if (terminalOrLocked.includes(existing.status)) {
        await this.prisma.universityAwardAccount.update({
          where: { id: existing.id },
          data: {
            eligibleCoreFaralins: projection.eligibleCoreFaralins,
            projectedAwardGbp: projection.estimatedAwardGbp,
          },
        });
        continue;
      }

      await this.prisma.universityAwardAccount.update({
        where: { id: existing.id },
        data: {
          eligibleCoreFaralins: projection.eligibleCoreFaralins,
          projectedAwardGbp: projection.estimatedAwardGbp,
          status:
            existing.status === UniversityAwardAccountStatus.ELIGIBLE
              ? UniversityAwardAccountStatus.ELIGIBLE
              : UniversityAwardAccountStatus.PROJECTED,
        },
      });
    }

    if (projectionUniversityIds.size > 0) {
      await this.prisma.universityAwardAccount.deleteMany({
        where: {
          studentProfileId,
          universityId: { notIn: [...projectionUniversityIds] },
          status: { in: [UniversityAwardAccountStatus.PROJECTED] },
        },
      });
    }
  }

  async applyApplicationStatus(
    studentProfileId: string,
    universityId: string,
    applicationStatus: ApplicationStatus,
  ): Promise<void> {
    await this.assertFunnelLimits(studentProfileId, universityId, applicationStatus);

    if (applicationStatus === ApplicationStatus.ENROLLED) {
      await this.handleEnrolment(studentProfileId, universityId);
      return;
    }

    const targetStatus = awardStatusForApplicationStatus(applicationStatus);
    if (!targetStatus) return;

    const projection = await this.prisma.universityProjection.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });

    const eligibleCoreFaralins = projection?.eligibleCoreFaralins ?? 0;
    const projectedAwardGbp = projection?.estimatedAwardGbp ?? 0;

    const existing = await this.prisma.universityAwardAccount.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });

    if (
      existing &&
      (existing.status === UniversityAwardAccountStatus.CONVERTED ||
        existing.status === UniversityAwardAccountStatus.FORFEITED)
    ) {
      if (
        applicationStatus === ApplicationStatus.WITHDRAWN ||
        applicationStatus === ApplicationStatus.REJECTED
      ) {
        return;
      }
      throw new BadRequestException(
        'This award account is locked after conversion or forfeiture',
      );
    }

    const timestamps: {
      reservedAt?: Date | null;
      confirmedAt?: Date | null;
      expiredAt?: Date | null;
      forfeitureReason?: string | null;
    } = {};

    if (targetStatus === 'RESERVED') timestamps.reservedAt = new Date();
    if (targetStatus === 'EXPIRED') {
      timestamps.expiredAt = new Date();
      timestamps.forfeitureReason = `Application ${applicationStatus.toLowerCase()}`;
    }

    if (!existing) {
      await this.prisma.universityAwardAccount.create({
        data: {
          studentProfileId,
          universityId,
          status: targetStatus as UniversityAwardAccountStatus,
          eligibleCoreFaralins,
          projectedAwardGbp,
          ...timestamps,
        },
      });
      return;
    }

    await this.prisma.universityAwardAccount.update({
      where: { id: existing.id },
      data: {
        status: targetStatus as UniversityAwardAccountStatus,
        eligibleCoreFaralins,
        projectedAwardGbp,
        ...timestamps,
      },
    });
  }

  /**
   * Convert award at enrolled university; forfeit all competing active accounts.
   * Dual-writes legacy FaralinTransaction status transitions.
   */
  async handleEnrolment(studentProfileId: string, universityId: string): Promise<void> {
    const convertedCount = await this.prisma.universityAwardAccount.count({
      where: {
        studentProfileId,
        status: UniversityAwardAccountStatus.CONVERTED,
        universityId: { not: universityId },
      },
    });
    if (convertedCount >= PLATFORM_LIMITS.maxConvertedAwards) {
      throw new BadRequestException(
        `Maximum ${PLATFORM_LIMITS.maxConvertedAwards} converted award allowed per student`,
      );
    }

    const projection = await this.prisma.universityProjection.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });

    const now = new Date();
    const account = await this.prisma.universityAwardAccount.upsert({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
      create: {
        studentProfileId,
        universityId,
        status: UniversityAwardAccountStatus.CONVERTED,
        eligibleCoreFaralins: projection?.eligibleCoreFaralins ?? 0,
        projectedAwardGbp: projection?.estimatedAwardGbp ?? 0,
        confirmedAt: now,
        convertedAt: now,
      },
      update: {
        status: UniversityAwardAccountStatus.CONVERTED,
        eligibleCoreFaralins: projection?.eligibleCoreFaralins ?? 0,
        projectedAwardGbp: projection?.estimatedAwardGbp ?? 0,
        confirmedAt: now,
        convertedAt: now,
        forfeitedAt: null,
        expiredAt: null,
        forfeitureReason: null,
      },
    });

    const amountGbp = Number(projection?.estimatedAwardGbp ?? account.projectedAwardGbp);
    const campaign = projection?.campaignId
      ? await this.prisma.universityCampaign.findUnique({
          where: { id: projection.campaignId },
        })
      : null;

    await this.prisma.awardConversion.upsert({
      where: { awardAccountId: account.id },
      create: {
        awardAccountId: account.id,
        deliveryType: campaign?.deliveryType ?? 'BURSARY',
        amountGbp,
        institutionReference: null,
        convertedAt: now,
        appealStatus: 'NONE',
        notes: 'Created on verified enrolment',
      },
      update: {
        amountGbp,
        deliveryType: campaign?.deliveryType ?? 'BURSARY',
        convertedAt: now,
      },
    });

    await this.prisma.universityAwardAccount.updateMany({
      where: {
        studentProfileId,
        universityId: { not: universityId },
        status: { in: AWARD_ACCOUNT_ACTIVE_STATUSES },
      },
      data: {
        status: UniversityAwardAccountStatus.FORFEITED,
        forfeitedAt: now,
        forfeitureReason: 'Enrolment at another partner university',
      },
    });

    // Legacy dual-write: confirm enrolled uni, forfeit competing conditional txs
    await this.prisma.faralinTransaction.updateMany({
      where: {
        studentProfileId,
        universityId,
        status: FaralinTransactionStatus.CONDITIONAL,
      },
      data: { status: FaralinTransactionStatus.CONFIRMED },
    });

    await this.prisma.faralinTransaction.updateMany({
      where: {
        studentProfileId,
        universityId: { not: universityId },
        status: {
          in: [FaralinTransactionStatus.CONDITIONAL, FaralinTransactionStatus.CONFIRMED],
        },
      },
      data: { status: FaralinTransactionStatus.FORFEITED },
    });
  }

  /**
   * Clearing exception: allow a late-followed partner to receive a PROJECTED account
   * from portable Core Faralins even when Faralin-active slots are full.
   */
  async ensureProjectedForClearingPartner(
    studentProfileId: string,
    universityId: string,
  ): Promise<void> {
    const projection = await this.prisma.universityProjection.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });
    if (!projection) return;

    const existing = await this.prisma.universityAwardAccount.findUnique({
      where: {
        studentProfileId_universityId: { studentProfileId, universityId },
      },
    });
    if (existing) return;

    await this.prisma.universityAwardAccount.create({
      data: {
        studentProfileId,
        universityId,
        status: UniversityAwardAccountStatus.PROJECTED,
        eligibleCoreFaralins: projection.eligibleCoreFaralins,
        projectedAwardGbp: projection.estimatedAwardGbp,
        metadata: { clearingException: true },
      },
    });
  }

  async getAwardAccountsForStudent(studentProfileId: string) {
    const accounts = await this.prisma.universityAwardAccount.findMany({
      where: { studentProfileId },
      include: { university: true },
      orderBy: { projectedAwardGbp: 'desc' },
    });

    return accounts.map((account) => ({
      universityId: account.universityId,
      universityName: account.university.name,
      universitySlug: account.university.slug,
      status: account.status as
        | 'PROJECTED'
        | 'ELIGIBLE'
        | 'RESERVED'
        | 'CONFIRMED'
        | 'CONVERTED'
        | 'EXPIRED'
        | 'FORFEITED',
      eligibleCoreFaralins: account.eligibleCoreFaralins,
      projectedAwardGbp: Number(account.projectedAwardGbp),
      reservedAt: account.reservedAt?.toISOString() ?? null,
      confirmedAt: account.confirmedAt?.toISOString() ?? null,
      convertedAt: account.convertedAt?.toISOString() ?? null,
      forfeitedAt: account.forfeitedAt?.toISOString() ?? null,
    }));
  }

  private async assertFunnelLimits(
    studentProfileId: string,
    universityId: string,
    nextStatus: ApplicationStatus,
  ): Promise<void> {
    const config = await this.getPlatformConfig();

    if (isFaralinActiveApplicationStatus(nextStatus)) {
      const activeCount = await this.prisma.application.count({
        where: {
          studentProfileId,
          universityId: { not: universityId },
          status: { in: [...FARALIN_ACTIVE_STATUSES] },
        },
      });
      if (activeCount >= config.maxFaralinActiveUniversities) {
        throw new BadRequestException(
          `Maximum ${config.maxFaralinActiveUniversities} Faralin-active universities allowed. ` +
            'You can still follow partners for projections (clearing exception).',
        );
      }
    }

    if (isOfferStageApplicationStatus(nextStatus)) {
      const offerCount = await this.prisma.application.count({
        where: {
          studentProfileId,
          universityId: { not: universityId },
          status: { in: [...OFFER_STAGE_STATUSES] },
        },
      });
      if (offerCount >= config.maxOfferStageUniversities) {
        throw new BadRequestException(
          `Maximum ${config.maxOfferStageUniversities} offer-stage universities allowed (firm + insurance)`,
        );
      }
    }
  }

  private async getPlatformConfig() {
    const config = await this.prisma.platformConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return (
      config ?? {
        maxFollowedUniversities: PLATFORM_LIMITS.maxFollowedUniversities,
        maxFaralinActiveUniversities: PLATFORM_LIMITS.maxFaralinActiveUniversities,
        maxOfferStageUniversities: PLATFORM_LIMITS.maxOfferStageUniversities,
        maxConvertedAwards: PLATFORM_LIMITS.maxConvertedAwards,
      }
    );
  }
}

const FARALIN_ACTIVE_STATUSES = [
  ApplicationStatus.FARALIN_ACTIVE,
  ApplicationStatus.REFERRAL_CLICKED,
  ApplicationStatus.APPLIED,
  ApplicationStatus.OFFER_RECEIVED,
  ApplicationStatus.OFFER_ACCEPTED,
  ApplicationStatus.FIRM,
  ApplicationStatus.INSURANCE,
  ApplicationStatus.ENROLLED,
] as const;

const OFFER_STAGE_STATUSES = [
  ApplicationStatus.FIRM,
  ApplicationStatus.INSURANCE,
  ApplicationStatus.OFFER_ACCEPTED,
] as const;
