import type { ReactNode } from 'react';
import type { SubjectIconKey } from '@/lib/subject-meta';

function SubjectIcon({ icon }: { icon: SubjectIconKey }) {
  const paths: Record<SubjectIconKey, ReactNode> = {
    math: (
      <path
        d="M4 7h8M7 4v6M11 11l3 3M14 11l-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    physics: (
      <>
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.8 6.8l1.4 1.4M15.8 15.8l1.4 1.4M17.2 6.8l-1.4 1.4M8.6 15.8l-1.4 1.4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    biology: (
      <path
        d="M12 4c-2.5 3-4 5.5-4 8a4 4 0 108 0c0-2.5-1.5-5-4-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
    chemistry: (
      <>
        <path d="M9 5h6l-2 11H11L9 5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    english: (
      <path
        d="M6 6h12v12H6V6zM9 9h6M9 12h6M9 15h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    history: (
      <path
        d="M6 8h12M6 12h8M6 16h10M8 6v12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    economics: (
      <path
        d="M5 16l4-8 4 5 4-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    'computer-science': (
      <path
        d="M7 8l-2 4 2 4h10l2-4-2-4H7zM10 12h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    psychology: (
      <>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 18c1-2.5 3-4 5-4s4 1.5 5 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
    geography: (
      <>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 12h14M12 5c2 2.5 3 5 3 7s-1 4.5-3 7M12 5c-2 2.5-3 5-3 7s1 4.5 3 7" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="onboarding-subject-icon-svg">
      {paths[icon]}
    </svg>
  );
}

export function OnboardingSubjectCard({
  name,
  description,
  icon,
  selected,
  onToggle,
}: {
  name: string;
  description: string;
  icon: SubjectIconKey;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`onboarding-subject-card${selected ? ' selected' : ''}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="onboarding-subject-icon">
        <SubjectIcon icon={icon} />
      </span>
      <span className="onboarding-subject-copy">
        <span className="onboarding-subject-name">{name}</span>
        <span className="onboarding-subject-desc">{description}</span>
      </span>
    </button>
  );
}
