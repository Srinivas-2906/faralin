import { describe, expect, it } from 'vitest';
import { toStaffStudentView } from './student-view.mapper';

const profile = {
  anonymousId: 'A1234',
  revealLevel: 'FULL',
  firstName: 'Ada',
  lastName: 'Lovelace',
  schoolName: 'Test School',
  yearGroup: 13,
  subjectSlugs: ['mathematics'],
  assessmentsCompleted: 2,
  totalFaralins: 500,
  performanceBand: 'strong',
};

describe('toStaffStudentView consent gating', () => {
  it('hides PII at FOLLOWER stage', () => {
    const view = toStaffStudentView(profile, {
      applicationStatus: 'FOLLOWER',
      grantedScopes: ['ANONYMOUS_ANALYTICS'],
    });
    expect(view.anonymousId).toBe('A1234');
    expect(view.firstName).toBeUndefined();
    expect(view.lastName).toBeUndefined();
    expect(view.schoolName).toBeUndefined();
    expect(view.totalFaralins).toBe(500);
  });

  it('reveals name on offer stage with OFFER_VERIFICATION consent', () => {
    const view = toStaffStudentView(profile, {
      applicationStatus: 'FIRM',
      grantedScopes: ['OFFER_VERIFICATION', 'ANONYMOUS_ANALYTICS'],
    });
    expect(view.firstName).toBe('Ada');
    expect(view.lastName).toBe('Lovelace');
  });
});
