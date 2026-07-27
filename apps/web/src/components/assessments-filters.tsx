'use client';

import type { ReactNode } from 'react';
import { InfoTooltip } from '@faralin/ui';
import {
  CatalogFilterChips,
  type CatalogFilterOption,
} from '@/components/catalog-filter-chips';
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

function FilterRow({
  label,
  tooltipLabel,
  tooltipContent,
  children,
}: {
  label: string;
  tooltipLabel: string;
  tooltipContent: string;
  children: ReactNode;
}) {
  return (
    <div className="catalog-filter-row">
      <p className="catalog-filter-row-label">
        {label}
        <InfoTooltip label={tooltipLabel}>{tooltipContent}</InfoTooltip>
      </p>
      {children}
    </div>
  );
}

export function AssessmentsFilters() {
  return (
    <>
      <FilterRow
        label="Difficulty"
        tooltipLabel="About difficulty levels"
        tooltipContent={STUDENT_HELP_COPY.assessmentDifficulty}
      >
        <CatalogFilterChips
          options={DIFFICULTY_FILTERS}
          paramKey="difficulty"
          ariaLabel="Filter by difficulty"
          basePath="/assessments"
        />
      </FilterRow>

      <FilterRow
        label="Trust"
        tooltipLabel="About trust levels"
        tooltipContent={STUDENT_HELP_COPY.assessmentTrust}
      >
        <CatalogFilterChips
          options={TRUST_FILTERS}
          paramKey="trust"
          ariaLabel="Filter by trust level"
          basePath="/assessments"
        />
      </FilterRow>

      <FilterRow
        label="Category"
        tooltipLabel="About categories"
        tooltipContent={STUDENT_HELP_COPY.assessmentCategory}
      >
        <CatalogFilterChips
          options={CATEGORY_FILTERS}
          paramKey="category"
          ariaLabel="Filter by category"
          basePath="/assessments"
        />
      </FilterRow>
    </>
  );
}
