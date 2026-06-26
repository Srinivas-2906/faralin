export interface UniversitySeedDef {
  slug: string;
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  applyUrl: string;
  isDemo: boolean;
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

export const universityDefs: UniversitySeedDef[] = [
  {
    slug: 'oxford',
    name: 'University of Oxford',
    shortName: 'Oxford',
    logoUrl: '/images/universities/oxford.jpg',
    description:
      'One of the oldest universities in the world, offering rigorous academic recognition for sustained effort.',
    websiteUrl: 'https://www.ox.ac.uk',
    applyUrl: 'https://www.ox.ac.uk/admissions',
    isDemo: true,
    conversion: {
      faralinsPerGbp: 200,
      minVerifiedPercent: 80,
      disclaimerText:
        'Estimated Oxford bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 80, scoreMultiplier: 1.2, improvementBonus: 40, difficultyMultiplier: 1.3 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 195,
      minVerifiedPercent: 80,
      disclaimerText:
        'Estimated Cambridge bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 85, scoreMultiplier: 1.22, improvementBonus: 42, difficultyMultiplier: 1.32 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 185,
      minVerifiedPercent: 78,
      disclaimerText:
        'Estimated Imperial bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 90, scoreMultiplier: 1.18, improvementBonus: 38, difficultyMultiplier: 1.28 },
  },
  {
    slug: 'ucl',
    name: 'University College London',
    shortName: 'UCL',
    logoUrl: '/images/universities/ucl.jpg',
    description:
      'London\'s global university, recognising diverse subject excellence and consistent improvement across disciplines.',
    websiteUrl: 'https://www.ucl.ac.uk',
    applyUrl: 'https://www.ucl.ac.uk/prospective-students/undergraduate/how-apply',
    isDemo: true,
    conversion: {
      faralinsPerGbp: 170,
      minVerifiedPercent: 75,
      disclaimerText:
        'Estimated UCL bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 95, scoreMultiplier: 1.12, improvementBonus: 48, difficultyMultiplier: 1.2 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 165,
      minVerifiedPercent: 74,
      disclaimerText:
        "Estimated King's College London bursary value is subject to admission, eligibility, and university terms.",
    },
    rules: { baseAmount: 92, scoreMultiplier: 1.1, improvementBonus: 50, difficultyMultiplier: 1.18 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 175,
      minVerifiedPercent: 76,
      disclaimerText:
        'Estimated LSE bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 88, scoreMultiplier: 1.15, improvementBonus: 44, difficultyMultiplier: 1.25 },
  },
  {
    slug: 'edinburgh',
    name: 'University of Edinburgh',
    shortName: 'Edinburgh',
    logoUrl: '/images/universities/edinburgh.jpg',
    description:
      'Scotland\'s ancient university, offering broad recognition for verified learning and subject mastery.',
    websiteUrl: 'https://www.ed.ac.uk',
    applyUrl: 'https://www.ed.ac.uk/studying/undergraduate/applying',
    isDemo: true,
    conversion: {
      faralinsPerGbp: 130,
      minVerifiedPercent: 72,
      disclaimerText:
        'Estimated Edinburgh bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 105, scoreMultiplier: 1.08, improvementBonus: 52, difficultyMultiplier: 1.14 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 140,
      minVerifiedPercent: 73,
      disclaimerText:
        'Estimated Durham bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 98, scoreMultiplier: 1.1, improvementBonus: 46, difficultyMultiplier: 1.16 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 125,
      minVerifiedPercent: 71,
      disclaimerText:
        'Estimated Warwick bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 108, scoreMultiplier: 1.06, improvementBonus: 55, difficultyMultiplier: 1.12 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 100,
      minVerifiedPercent: 70,
      disclaimerText:
        'Estimated Southampton bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 120, scoreMultiplier: 1.0, improvementBonus: 60, difficultyMultiplier: 1.1 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 120,
      minVerifiedPercent: 75,
      disclaimerText:
        'Estimated Manchester bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 100, scoreMultiplier: 1.1, improvementBonus: 50, difficultyMultiplier: 1.15 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 110,
      minVerifiedPercent: 72,
      disclaimerText:
        'Estimated Bristol bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 95, scoreMultiplier: 1.05, improvementBonus: 45, difficultyMultiplier: 1.12 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 105,
      minVerifiedPercent: 68,
      disclaimerText:
        'Estimated Leeds bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 115, scoreMultiplier: 1.02, improvementBonus: 58, difficultyMultiplier: 1.08 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 108,
      minVerifiedPercent: 69,
      disclaimerText:
        'Estimated Birmingham bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 112, scoreMultiplier: 1.04, improvementBonus: 54, difficultyMultiplier: 1.1 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 102,
      minVerifiedPercent: 67,
      disclaimerText:
        'Estimated Nottingham bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 118, scoreMultiplier: 1.0, improvementBonus: 62, difficultyMultiplier: 1.06 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 98,
      minVerifiedPercent: 66,
      disclaimerText:
        'Estimated Sheffield bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 122, scoreMultiplier: 0.98, improvementBonus: 64, difficultyMultiplier: 1.05 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 95,
      minVerifiedPercent: 65,
      disclaimerText:
        'Estimated Newcastle bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 125, scoreMultiplier: 0.96, improvementBonus: 66, difficultyMultiplier: 1.04 },
  },
  {
    slug: 'cardiff',
    name: 'Cardiff University',
    shortName: 'Cardiff',
    logoUrl: '/images/universities/cardiff.jpg',
    description:
      'Wales\' leading Russell Group university with accessible recognition for verified student progress.',
    websiteUrl: 'https://www.cardiff.ac.uk',
    applyUrl: 'https://www.cardiff.ac.uk/study/undergraduate/applying',
    isDemo: true,
    conversion: {
      faralinsPerGbp: 92,
      minVerifiedPercent: 64,
      disclaimerText:
        'Estimated Cardiff bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 128, scoreMultiplier: 0.95, improvementBonus: 68, difficultyMultiplier: 1.03 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 115,
      minVerifiedPercent: 73,
      disclaimerText:
        'Estimated Bath bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 102, scoreMultiplier: 1.08, improvementBonus: 48, difficultyMultiplier: 1.14 },
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
    isDemo: true,
    conversion: {
      faralinsPerGbp: 90,
      minVerifiedPercent: 65,
      disclaimerText:
        'Estimated Exeter bursary value is subject to admission, eligibility, and university terms.',
    },
    rules: { baseAmount: 130, scoreMultiplier: 1.0, improvementBonus: 70, difficultyMultiplier: 1.0 },
  },
];
