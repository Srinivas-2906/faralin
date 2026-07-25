import { describe, expect, it, vi } from 'vitest';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus, FaralinTransactionStatus } from '@faralin/db';

describe('ApplicationsService enrollment confirmation', () => {
  it('promotes conditional Faralin transactions to confirmed on ENROLLED', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const update = vi.fn().mockResolvedValue({ id: 'app-1', status: 'ENROLLED' });
    const prisma = {
      application: {
        findUnique: vi.fn().mockResolvedValue({ id: 'app-1' }),
        update,
      },
      faralinTransaction: {
        updateMany,
        groupBy: vi.fn(),
      },
    };

    const service = new ApplicationsService(prisma as never);
    await service.updateApplicationStatus('uni-1', 'student-1', ApplicationStatus.ENROLLED);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        studentProfileId: 'student-1',
        universityId: 'uni-1',
        status: FaralinTransactionStatus.CONDITIONAL,
      },
      data: { status: FaralinTransactionStatus.CONFIRMED },
    });
  });
});
