export type SubjectIconKey =
  | 'math'
  | 'physics'
  | 'biology'
  | 'chemistry'
  | 'english'
  | 'history'
  | 'economics'
  | 'computer-science'
  | 'psychology'
  | 'geography';

export interface SubjectMeta {
  description: string;
  icon: SubjectIconKey;
}

export const SUBJECT_META: Record<string, SubjectMeta> = {
  mathematics: {
    icon: 'math',
    description: 'Algebra, calculus, and structured problem-solving',
  },
  physics: {
    icon: 'physics',
    description: 'Forces, energy, and how the physical world works',
  },
  biology: {
    icon: 'biology',
    description: 'Living systems, cells, and ecosystems',
  },
  chemistry: {
    icon: 'chemistry',
    description: 'Reactions, materials, and molecular structure',
  },
  english: {
    icon: 'english',
    description: 'Literature, analysis, and written argument',
  },
  history: {
    icon: 'history',
    description: 'Sources, context, and historical reasoning',
  },
  economics: {
    icon: 'economics',
    description: 'Markets, policy, and applied decision-making',
  },
  'computer-science': {
    icon: 'computer-science',
    description: 'Logic, programming, and computational thinking',
  },
  psychology: {
    icon: 'psychology',
    description: 'Behaviour, cognition, and research methods',
  },
  geography: {
    icon: 'geography',
    description: 'Places, environments, and human interaction',
  },
};

export function getSubjectMeta(slug: string): SubjectMeta {
  return (
    SUBJECT_META[slug] ?? {
      icon: 'math',
      description: 'Earn recognition through verified subject assessments',
    }
  );
}
