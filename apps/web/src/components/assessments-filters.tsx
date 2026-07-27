'use client';

import { AssessmentsCatalogInsight } from '@/components/catalog-insight';
import { CatalogFilterToolbar } from '@/components/catalog-filter-toolbar';
import {
  CatalogFilterGroupParents,
  CatalogFilterGroupsPanel,
  CatalogFilterGroupsProvider,
  type CatalogFilterGroup,
} from '@/components/catalog-filter-groups';
import type { CatalogFilterOption } from '@/components/catalog-filter-chips';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

const DIFFICULTY_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All levels' },
  { value: 'FOUNDATION', label: 'Foundation' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const TRUST_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All trust levels' },
  { value: 'PRACTICE', label: 'Practice' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'PARTNER_VERIFIED', label: 'Partner verified' },
];

const CATEGORY_FILTERS: CatalogFilterOption[] = [
  { value: '', label: 'All categories' },
  { value: 'EMPLOYABILITY', label: 'Employability' },
  { value: 'ACADEMIC_SKILLS', label: 'Academic Skills' },
  { value: 'FINANCIAL_WELLBEING', label: 'Financial Wellbeing' },
  { value: 'MENTAL_WELLBEING', label: 'Mental Wellbeing' },
  { value: 'DIGITAL_SKILLS', label: 'Digital Skills' },
  { value: 'SUSTAINABILITY', label: 'Sustainability' },
  { value: 'DIVERSITY_INCLUSION', label: 'Diversity & Inclusion' },
  { value: 'STUDENT_LIFE', label: 'Student Life' },
  { value: 'ACADEMIC_SUBJECT', label: 'Academic Subject' },
];

const ASSESSMENT_GROUPS: CatalogFilterGroup[] = [
  {
    id: 'difficulty',
    label: 'Difficulty',
    paramKey: 'difficulty',
    options: DIFFICULTY_FILTERS,
    tooltipLabel: 'About difficulty levels',
    tooltipContent: STUDENT_HELP_COPY.assessmentDifficulty,
  },
  {
    id: 'trust',
    label: 'Trust',
    paramKey: 'trust',
    options: TRUST_FILTERS,
    tooltipLabel: 'About trust levels',
    tooltipContent: STUDENT_HELP_COPY.assessmentTrust,
  },
  {
    id: 'category',
    label: 'Category',
    paramKey: 'category',
    options: CATEGORY_FILTERS,
    tooltipLabel: 'About categories',
    tooltipContent: STUDENT_HELP_COPY.assessmentCategory,
  },
];

export function AssessmentsCatalogToolbar() {
  return (
    <CatalogFilterGroupsProvider basePath="/assessments" groups={ASSESSMENT_GROUPS}>
      <CatalogFilterToolbar
        insight={<AssessmentsCatalogInsight filters={<CatalogFilterGroupParents />} />}
        filterPanel={<CatalogFilterGroupsPanel />}
      />
    </CatalogFilterGroupsProvider>
  );
}
