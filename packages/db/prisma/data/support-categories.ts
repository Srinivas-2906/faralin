export const supportCategoryDefs = [
  {
    slug: 'account',
    name: 'Account',
    description: 'Login, profile, and access issues',
    sortOrder: 1,
  },
  {
    slug: 'payments',
    name: 'Payments',
    description: 'Bursary, Faralin conversion, and billing',
    sortOrder: 2,
  },
  {
    slug: 'university-partnership',
    name: 'University partnership',
    description: 'Partnership and institutional enquiries',
    sortOrder: 3,
  },
  {
    slug: 'technical',
    name: 'Technical',
    description: 'Platform bugs and technical issues',
    sortOrder: 4,
  },
  {
    slug: 'general',
    name: 'General',
    description: 'General enquiries and other topics',
    sortOrder: 5,
  },
] as const;
