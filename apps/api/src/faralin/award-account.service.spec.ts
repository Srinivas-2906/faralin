import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import {
  ApplicationStatus,
  FaralinTransactionStatus,
  UniversityAwardAccountStatus,
} from '@faralin/db';
import { AwardAccountService } from './award-account.service';

function buildService(prisma: Record<string, unknown>) {
  return new AwardAccountService(prisma as never);
}

describe('AwardAccountService.handleEnrolment', () => {
  let awardUpsert: ReturnType<typeof vi.fn>;
  let awardUpdateMany: ReturnType<typeof vi.fn>;
  let txUpdateMany: ReturnType<typeof vi.fn>;
  let awardCount: ReturnType<typeof vi.fn>;
  let projectionFind: ReturnType<typeof vi.fn>;
  let service: AwardAccountService;

  beforeEach(() => {
    awardUpsert = vi.fn().mockResolvedValue({
      id: 'account-1',
      projectedAwardGbp: 300,
    });
    awardUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
    txUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    awardCount = vi.fn().mockResolvedValue(0);
    projectionFind = vi.fn().mockResolvedValue({
      eligibleCoreFaralins: 30000,
      estimatedAwardGbp: 300,
    });

    service = buildService({
      universityAwardAccount: {
        count: awardCount,
        upsert: awardUpsert,
        updateMany: awardUpdateMany,
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      universityProjection: { findUnique: projectionFind, findMany: vi.fn() },
      universityCampaign: { findUnique: vi.fn().mockResolvedValue(null) },
      awardConversion: { upsert: vi.fn().mockResolvedValue({}) },
      faralinTransaction: { updateMany: txUpdateMany },
      application: { count: vi.fn() },
      platformConfig: { findFirst: vi.fn().mockResolvedValue(null) },
    });
  });

  it('converts enrolled uni account and forfeits competing active accounts', async () => {
    await service.handleEnrolment('student-1', 'uni-enrolled');

    expect(awardUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          studentProfileId_universityId: {
            studentProfileId: 'student-1',
            universityId: 'uni-enrolled',
          },
        },
        create: expect.objectContaining({
          status: UniversityAwardAccountStatus.CONVERTED,
        }),
        update: expect.objectContaining({
          status: UniversityAwardAccountStatus.CONVERTED,
        }),
      }),
    );

    expect(awardUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          studentProfileId: 'student-1',
          universityId: { not: 'uni-enrolled' },
        }),
        data: expect.objectContaining({
          status: UniversityAwardAccountStatus.FORFEITED,
        }),
      }),
    );

    expect(txUpdateMany).toHaveBeenCalledWith({
      where: {
        studentProfileId: 'student-1',
        universityId: 'uni-enrolled',
        status: FaralinTransactionStatus.CONDITIONAL,
      },
      data: { status: FaralinTransactionStatus.CONFIRMED },
    });

    expect(txUpdateMany).toHaveBeenCalledWith({
      where: {
        studentProfileId: 'student-1',
        universityId: { not: 'uni-enrolled' },
        status: {
          in: [FaralinTransactionStatus.CONDITIONAL, FaralinTransactionStatus.CONFIRMED],
        },
      },
      data: { status: FaralinTransactionStatus.FORFEITED },
    });
  });

  it('rejects enrolment when another converted award already exists', async () => {
    awardCount.mockResolvedValue(1);
    await expect(service.handleEnrolment('student-1', 'uni-2')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe('AwardAccountService funnel limits', () => {
  it('blocks a 6th Faralin-active university', async () => {
    const applicationCount = vi.fn().mockResolvedValue(5);
    const service = buildService({
      universityAwardAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      universityProjection: { findUnique: vi.fn().mockResolvedValue(null) },
      faralinTransaction: { updateMany: vi.fn() },
      application: { count: applicationCount },
      platformConfig: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    await expect(
      service.applyApplicationStatus(
        'student-1',
        'uni-6',
        ApplicationStatus.FARALIN_ACTIVE,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(applicationCount).toHaveBeenCalled();
  });

  it('blocks a 3rd offer-stage university', async () => {
    const applicationCount = vi
      .fn()
      .mockResolvedValueOnce(2) // faralin-active check passes with room
      .mockResolvedValueOnce(2); // offer-stage full
    const service = buildService({
      universityAwardAccount: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
        updateMany: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      universityProjection: { findUnique: vi.fn().mockResolvedValue(null) },
      faralinTransaction: { updateMany: vi.fn() },
      application: { count: applicationCount },
      platformConfig: { findFirst: vi.fn().mockResolvedValue(null) },
    });

    // FIRM is both faralin-active and offer-stage; first count is faralin-active
    applicationCount.mockReset();
    applicationCount
      .mockResolvedValueOnce(1) // faralin-active others
      .mockResolvedValueOnce(2); // offer-stage others

    await expect(
      service.applyApplicationStatus('student-1', 'uni-3', ApplicationStatus.FIRM),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
