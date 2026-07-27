import { describe, expect, it } from 'vitest';
import { isCampaignActiveNow, validateCampaignBoosts } from '@faralin/types';

describe('campaign helpers', () => {
  it('clamps boosts to platform bounds', () => {
    expect(validateCampaignBoosts(0.1, 3)).toEqual({
      universityBoost: 0.5,
      subjectAlignmentBoost: 1.5,
    });
  });

  it('detects active campaign windows', () => {
    const now = new Date('2026-06-01');
    expect(
      isCampaignActiveNow(
        {
          isActive: true,
          startsAt: '2026-01-01',
          endsAt: '2026-12-31',
        },
        now,
      ),
    ).toBe(true);
    expect(
      isCampaignActiveNow(
        {
          isActive: false,
          startsAt: '2026-01-01',
          endsAt: '2026-12-31',
        },
        now,
      ),
    ).toBe(false);
  });
});
