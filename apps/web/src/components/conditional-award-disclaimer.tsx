import { CONDITIONAL_AWARD_DISCLAIMER } from '@faralin/types';

type ConditionalAwardDisclaimerProps = {
  compact?: boolean;
  className?: string;
};

export function ConditionalAwardDisclaimer({
  compact = false,
  className = '',
}: ConditionalAwardDisclaimerProps) {
  return (
    <p
      className={`conditional-award-disclaimer${compact ? ' conditional-award-disclaimer--compact' : ''} ${className}`.trim()}
      role="note"
    >
      {CONDITIONAL_AWARD_DISCLAIMER}
    </p>
  );
}
