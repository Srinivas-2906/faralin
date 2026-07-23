import type { UniversityPrestigeTier } from '@faralin/types';
import {
  RANKING_SOURCE,
  buildConversionDisclaimer,
  getTierEconomics,
  getUniversityRankingMeta,
} from '@faralin/types';

export interface UniversitySeedDef {
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  applyUrl: string;
  isDemo: boolean;
  guardianRank2025: number;
  prestigeTier: UniversityPrestigeTier;
  rankingSource: string;
  conversion: {
    faralinsPerGbp: number;
    minVerifiedPercent: number;
    disclaimerText: string;
  };
  rules: {
    baseAmount: number;
    scoreMultiplier: number;
    improvementBonus: number;
    difficultyMultiplier: number;
  };
}

interface UniversityCoreDef {
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  applyUrl: string;
}

function buildUniversityDef(core: UniversityCoreDef): UniversitySeedDef {
  const ranking = getUniversityRankingMeta(core.slug);
  if (!ranking) {
    throw new Error(`Missing ranking metadata for university: ${core.slug}`);
  }

  const economics = getTierEconomics(core.slug);

  return {
    ...core,
    isDemo: true,
    guardianRank2025: ranking.guardianRank2025,
    prestigeTier: ranking.prestigeTier,
    rankingSource: RANKING_SOURCE,
    conversion: {
      faralinsPerGbp: economics.faralinsPerGbp,
      minVerifiedPercent: economics.minVerifiedPercent,
      disclaimerText: buildConversionDisclaimer(core.shortName),
    },
    rules: {
      baseAmount: economics.baseAmount,
      scoreMultiplier: economics.scoreMultiplier,
      improvementBonus: economics.improvementBonus,
      difficultyMultiplier: economics.difficultyMultiplier,
    },
  };
}

const universityCores: UniversityCoreDef[] = [
  {
    slug: 'oxford',
    name: 'University of Oxford',
    shortName: 'Oxford',
    logoUrl: '/images/universities/oxford.jpg',
    description:
      'One of the oldest universities in the world, offering rigorous academic recognition for sustained effort.',
    websiteUrl: 'https://www.ox.ac.uk',
    applyUrl: 'https://www.ox.ac.uk/admissions',
  },
  {
    slug: 'cambridge',
    name: 'University of Cambridge',
    shortName: 'Cambridge',
    logoUrl: '/images/universities/cambridge.jpg',
    description:
      'A world-leading research university recognising exceptional academic progress and intellectual curiosity.',
    websiteUrl: 'https://www.cam.ac.uk',
    applyUrl: 'https://www.undergraduate.study.cam.ac.uk/applying',
  },
  {
    slug: 'imperial',
    name: 'Imperial College London',
    shortName: 'Imperial',
    logoUrl: '/images/universities/imperial.jpg',
    description:
      'A science and technology specialist university rewarding verified STEM achievement and problem-solving.',
    websiteUrl: 'https://www.imperial.ac.uk',
    applyUrl: 'https://www.imperial.ac.uk/study/apply/',
  },
  {
    slug: 'ucl',
    name: 'University College London',
    shortName: 'UCL',
    logoUrl: '/images/universities/ucl.jpg',
    description:
      "London's global university, recognising diverse subject excellence and consistent improvement across disciplines.",
    websiteUrl: 'https://www.ucl.ac.uk',
    applyUrl: 'https://www.ucl.ac.uk/prospective-students/undergraduate/how-apply',
  },
  {
    slug: 'kings-college-london',
    name: "King's College London",
    shortName: "King's",
    logoUrl: '/images/universities/kings-college-london.jpg',
    description:
      'A leading London university with strong recognition for humanities, health sciences, and social sciences.',
    websiteUrl: 'https://www.kcl.ac.uk',
    applyUrl: 'https://www.kcl.ac.uk/study/undergraduate/how-to-apply',
  },
  {
    slug: 'lse',
    name: 'London School of Economics and Political Science',
    shortName: 'LSE',
    logoUrl: '/images/universities/lse.jpg',
    description:
      'A specialist social science university rewarding analytical reasoning and evidence-based argument.',
    websiteUrl: 'https://www.lse.ac.uk',
    applyUrl: 'https://www.lse.ac.uk/study-at-lse/Undergraduate/How-to-Apply',
  },
  {
    slug: 'edinburgh',
    name: 'University of Edinburgh',
    shortName: 'Edinburgh',
    logoUrl: '/images/universities/edinburgh.jpg',
    description:
      "Scotland's ancient university, offering broad recognition for verified learning and subject mastery.",
    websiteUrl: 'https://www.ed.ac.uk',
    applyUrl: 'https://www.ed.ac.uk/studying/undergraduate/applying',
  },
  {
    slug: 'durham',
    name: 'Durham University',
    shortName: 'Durham',
    logoUrl: '/images/universities/durham.jpg',
    description:
      'A collegiate Russell Group university recognising sustained academic effort and written reasoning.',
    websiteUrl: 'https://www.durham.ac.uk',
    applyUrl: 'https://www.durham.ac.uk/study/undergraduate/how-to-apply/',
  },
  {
    slug: 'warwick',
    name: 'University of Warwick',
    shortName: 'Warwick',
    logoUrl: '/images/universities/warwick.jpg',
    description:
      'A research-intensive university with strong employer links and generous recognition for improvement.',
    websiteUrl: 'https://warwick.ac.uk',
    applyUrl: 'https://warwick.ac.uk/study/undergraduate/apply/',
  },
  {
    slug: 'southampton',
    name: 'University of Southampton',
    shortName: 'Southampton',
    logoUrl: '/images/universities/southampton.jpg',
    description:
      'A research-intensive Russell Group university with generous recognition for consistent progress.',
    websiteUrl: 'https://www.southampton.ac.uk',
    applyUrl: 'https://www.southampton.ac.uk/courses/how-to-apply',
  },
  {
    slug: 'manchester',
    name: 'University of Manchester',
    shortName: 'Manchester',
    logoUrl: '/images/universities/manchester.jpg',
    description:
      'A major civic university rewarding improvement and subject strength across disciplines.',
    websiteUrl: 'https://www.manchester.ac.uk',
    applyUrl: 'https://www.manchester.ac.uk/study/undergraduate/applications/',
  },
  {
    slug: 'bristol',
    name: 'University of Bristol',
    shortName: 'Bristol',
    logoUrl: '/images/universities/bristol.jpg',
    description:
      'A Russell Group university recognising verified learning and written reasoning.',
    websiteUrl: 'https://www.bristol.ac.uk',
    applyUrl: 'https://www.bristol.ac.uk/study/undergraduate/apply/',
  },
  {
    slug: 'leeds',
    name: 'University of Leeds',
    shortName: 'Leeds',
    logoUrl: '/images/universities/leeds.jpg',
    description:
      'A large research university with strong recognition budgets for motivated students across all subjects.',
    websiteUrl: 'https://www.leeds.ac.uk',
    applyUrl: 'https://www.leeds.ac.uk/undergraduate-applications/doc/apply',
  },
  {
    slug: 'birmingham',
    name: 'University of Birmingham',
    shortName: 'Birmingham',
    logoUrl: '/images/universities/birmingham.jpg',
    description:
      'A founding redbrick university rewarding verified assessments and steady academic progress.',
    websiteUrl: 'https://www.birmingham.ac.uk',
    applyUrl: 'https://www.birmingham.ac.uk/study/undergraduate/apply',
  },
  {
    slug: 'nottingham',
    name: 'University of Nottingham',
    shortName: 'Nottingham',
    logoUrl: '/images/universities/nottingham.jpg',
    description:
      'A global university with campuses in the UK and abroad, recognising consistent subject achievement.',
    websiteUrl: 'https://www.nottingham.ac.uk',
    applyUrl: 'https://www.nottingham.ac.uk/studywithus/undergraduate/apply/index.aspx',
  },
  {
    slug: 'sheffield',
    name: 'University of Sheffield',
    shortName: 'Sheffield',
    logoUrl: '/images/universities/sheffield.jpg',
    description:
      'A Russell Group university with a strong widening participation mission and fair recognition rules.',
    websiteUrl: 'https://www.sheffield.ac.uk',
    applyUrl: 'https://www.sheffield.ac.uk/undergraduate/apply',
  },
  {
    slug: 'newcastle',
    name: 'Newcastle University',
    shortName: 'Newcastle',
    logoUrl: '/images/universities/newcastle.jpg',
    description:
      'A research-intensive university in the North East rewarding improvement and subject engagement.',
    websiteUrl: 'https://www.ncl.ac.uk',
    applyUrl: 'https://www.ncl.ac.uk/undergraduate/apply/',
  },
  {
    slug: 'cardiff',
    name: 'Cardiff University',
    shortName: 'Cardiff',
    logoUrl: '/images/universities/cardiff.jpg',
    description:
      "Wales' leading Russell Group university with accessible recognition for verified student progress.",
    websiteUrl: 'https://www.cardiff.ac.uk',
    applyUrl: 'https://www.cardiff.ac.uk/study/undergraduate/applying',
  },
  {
    slug: 'bath',
    name: 'University of Bath',
    shortName: 'Bath',
    logoUrl: '/images/universities/bath.jpg',
    description:
      'A top-ranked university for graduate outcomes, recognising rigorous verified assessment performance.',
    websiteUrl: 'https://www.bath.ac.uk',
    applyUrl: 'https://www.bath.ac.uk/guides/applying-for-undergraduate-courses/',
  },
  {
    slug: 'exeter',
    name: 'University of Exeter',
    shortName: 'Exeter',
    logoUrl: '/images/universities/exeter.jpg',
    description:
      'A welcoming university with higher reward budgets to attract motivated students.',
    websiteUrl: 'https://www.exeter.ac.uk',
    applyUrl: 'https://www.exeter.ac.uk/undergraduate/apply/',
  },
];

export const universityDefs: UniversitySeedDef[] = universityCores.map(buildUniversityDef);
