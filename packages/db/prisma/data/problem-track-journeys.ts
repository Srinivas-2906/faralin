export type JourneyMilestone = {
  trackSlug: string;
  sortOrder: number;
  label: string;
  bonusFaralins?: number;
  badgeLabel?: string;
};

export type ProblemTrackJourneySeedDef = {
  slug: string;
  title: string;
  description: string;
  milestones: JourneyMilestone[];
};

export const problemTrackJourneyDefs: ProblemTrackJourneySeedDef[] = [
  {
    slug: 'research-skills-pathway',
    title: 'Research Skills Pathway',
    description: 'Build research capability through structured problem tracks.',
    milestones: [
      {
        trackSlug: 'your-genes-in-2200',
        sortOrder: 1,
        label: 'Genetics foundations',
        bonusFaralins: 25,
        badgeLabel: 'Research Starter',
      },
    ],
  },
  {
    slug: 'stem-explorer',
    title: 'STEM Explorer',
    description: 'Explore STEM problem-solving tracks in sequence.',
    milestones: [
      {
        trackSlug: 'your-genes-in-2200',
        sortOrder: 1,
        label: 'Core STEM track',
        bonusFaralins: 20,
      },
    ],
  },
];

export const DEFAULT_RECOGNITION_TIER_THRESHOLDS = [
  { tier: 'EXPLORER' as const, minVerifiedFaralins: 0, benefitsSummary: 'Starting your recognition journey' },
  { tier: 'BUILDER' as const, minVerifiedFaralins: 500, benefitsSummary: 'Consistent verified activity' },
  { tier: 'ACHIEVER' as const, minVerifiedFaralins: 1500, benefitsSummary: 'Strong portfolio of verified work' },
  { tier: 'CHAMPION' as const, minVerifiedFaralins: 3000, benefitsSummary: 'Outstanding verified recognition' },
];
