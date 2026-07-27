import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignDeliveryType, Prisma } from '@faralin/db';
import {
  type CreateCampaignInput,
  validateCampaignBoosts,
} from '@faralin/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignService {
  constructor(private prisma: PrismaService) {}

  async listForUniversity(universityId: string) {
    const campaigns = await this.prisma.universityCampaign.findMany({
      where: { universityId },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });
    return campaigns.map((c) => this.toSummary(c));
  }

  async create(universityId: string, input: CreateCampaignInput) {
    this.assertDates(input.startsAt, input.endsAt);
    const boosts = validateCampaignBoosts(
      input.universityBoost,
      input.subjectAlignmentBoost ?? 1,
    );

    const campaign = await this.prisma.universityCampaign.create({
      data: {
        universityId,
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        isActive: input.isActive ?? true,
        budgetGbp: input.budgetGbp,
        perStudentCapGbp: input.perStudentCapGbp ?? null,
        universityBoost: boosts.universityBoost,
        subjectAlignmentBoost: boosts.subjectAlignmentBoost,
        subjectFilters: input.subjectFilters ?? undefined,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
        deliveryType: (input.deliveryType as CampaignDeliveryType) ?? 'BURSARY',
      },
    });

    return this.toSummary(campaign);
  }

  async update(
    universityId: string,
    campaignId: string,
    input: Partial<CreateCampaignInput> & { isActive?: boolean },
  ) {
    const existing = await this.prisma.universityCampaign.findFirst({
      where: { id: campaignId, universityId },
    });
    if (!existing) throw new NotFoundException('Campaign not found');

    const startsAt = input.startsAt ?? existing.startsAt.toISOString();
    const endsAt = input.endsAt ?? existing.endsAt.toISOString();
    this.assertDates(startsAt, endsAt);

    const boosts = validateCampaignBoosts(
      input.universityBoost ?? Number(existing.universityBoost),
      input.subjectAlignmentBoost ?? Number(existing.subjectAlignmentBoost),
    );

    const campaign = await this.prisma.universityCampaign.update({
      where: { id: campaignId },
      data: {
        name: input.name?.trim(),
        slug: input.slug?.trim().toLowerCase(),
        isActive: input.isActive,
        budgetGbp: input.budgetGbp,
        perStudentCapGbp: input.perStudentCapGbp,
        universityBoost: boosts.universityBoost,
        subjectAlignmentBoost: boosts.subjectAlignmentBoost,
        subjectFilters:
          input.subjectFilters === undefined
            ? undefined
            : input.subjectFilters === null
              ? Prisma.JsonNull
              : input.subjectFilters,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
        endsAt: input.endsAt ? new Date(input.endsAt) : undefined,
        deliveryType: input.deliveryType as CampaignDeliveryType | undefined,
      },
    });

    return this.toSummary(campaign);
  }

  async deactivate(universityId: string, campaignId: string) {
    return this.update(universityId, campaignId, { isActive: false });
  }

  async getActiveCampaignBoost(universityId: string, subjectSlugs: string[] = []) {
    const now = new Date();
    const campaigns = await this.prisma.universityCampaign.findMany({
      where: { universityId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    const subjectSet = new Set(subjectSlugs);
    const active = campaigns.find((campaign) => {
      if (campaign.startsAt > now || campaign.endsAt < now) return false;
      const filters = Array.isArray(campaign.subjectFilters)
        ? (campaign.subjectFilters as string[])
        : null;
      if (!filters || filters.length === 0) return true;
      return filters.some((slug) => subjectSet.has(slug));
    });
    return active ? this.toSummary(active) : null;
  }

  private assertDates(startsAt: string, endsAt: string) {
    if (new Date(startsAt) >= new Date(endsAt)) {
      throw new BadRequestException('Campaign endsAt must be after startsAt');
    }
  }

  private toSummary(campaign: {
    id: string;
    universityId: string;
    name: string;
    slug: string;
    isActive: boolean;
    budgetGbp: { toNumber?: () => number } | number | string;
    perStudentCapGbp: { toNumber?: () => number } | number | string | null;
    spentGbp: { toNumber?: () => number } | number | string;
    universityBoost: { toNumber?: () => number } | number | string;
    subjectAlignmentBoost: { toNumber?: () => number } | number | string;
    subjectFilters: unknown;
    startsAt: Date;
    endsAt: Date;
    deliveryType: string;
  }) {
    return {
      id: campaign.id,
      universityId: campaign.universityId,
      name: campaign.name,
      slug: campaign.slug,
      isActive: campaign.isActive,
      budgetGbp: Number(campaign.budgetGbp),
      perStudentCapGbp:
        campaign.perStudentCapGbp == null ? null : Number(campaign.perStudentCapGbp),
      spentGbp: Number(campaign.spentGbp),
      universityBoost: Number(campaign.universityBoost),
      subjectAlignmentBoost: Number(campaign.subjectAlignmentBoost),
      subjectFilters: Array.isArray(campaign.subjectFilters)
        ? (campaign.subjectFilters as string[])
        : null,
      startsAt: campaign.startsAt.toISOString(),
      endsAt: campaign.endsAt.toISOString(),
      deliveryType: campaign.deliveryType as
        | 'BURSARY'
        | 'FEE_WAIVER'
        | 'SCHOLARSHIP'
        | 'OTHER',
    };
  }
}
