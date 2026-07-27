import { describe, expect, it, vi } from 'vitest';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from '@faralin/db';

describe('ApplicationsService enrollment confirmation', () => {
  it('delegates enrolment forfeiture to AwardAccountService then updates application', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'app-1', status: 'ENROLLED' });
    const applyApplicationStatus = vi.fn().mockResolvedValue(undefined);
    const prisma = {
      application: {
        findUnique: vi.fn().mockResolvedValue({ id: 'app-1' }),
        update,
      },
      faralinTransaction: {
        updateMany: vi.fn(),
        groupBy: vi.fn(),
      },
    };

    const service = new ApplicationsService(prisma as never, {
      applyApplicationStatus,
    } as never);

    await service.updateApplicationStatus('uni-1', 'student-1', ApplicationStatus.ENROLLED);

    expect(applyApplicationStatus).toHaveBeenCalledWith(
      'student-1',
      'uni-1',
      ApplicationStatus.ENROLLED,
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: 'app-1' },
      data: expect.objectContaining({ status: ApplicationStatus.ENROLLED }),
    });
  });
});
