import { RECOGNITION_TIER_LABELS, type StudentRecognitionTier } from '@faralin/types';

interface DashboardStatsBarProps {
  faralinsEarned: number;
  tracksCompleted: number;
  assessmentsCompleted: number;
  recognitionLabel?: string;
  recognitionNextTier?: StudentRecognitionTier | string | null;
  recognitionProgressPercent?: number;
  highestEstimatedAwardGbp?: number | null;
}

export function DashboardStatsBar({
  faralinsEarned,
  tracksCompleted,
  assessmentsCompleted,
  recognitionLabel = 'Explorer',
  recognitionNextTier = null,
  recognitionProgressPercent,
  highestEstimatedAwardGbp = null,
}: DashboardStatsBarProps) {
  const nextLabel =
    recognitionNextTier && recognitionNextTier in RECOGNITION_TIER_LABELS
      ? RECOGNITION_TIER_LABELS[recognitionNextTier as StudentRecognitionTier]
      : recognitionNextTier
        ? String(recognitionNextTier).charAt(0) +
          String(recognitionNextTier).slice(1).toLowerCase()
        : null;

  return (
    <div className="dashboard-progress" aria-label="Your Faralin progress">
      <p className="dashboard-progress-eyebrow">Your Faralin progress</p>
      <p className="dashboard-progress-primary">
        <span className="dashboard-progress-primary-value">
          {faralinsEarned.toLocaleString()}
        </span>{' '}
        Faralins earned
      </p>
      <p className="dashboard-progress-explainer">
        Your portable achievement balance. You earn Faralins once, regardless of how many
        universities you follow.
      </p>
      <ul className="dashboard-progress-meta">
        <li>
          {assessmentsCompleted.toLocaleString()} assessment
          {assessmentsCompleted === 1 ? '' : 's'} completed
        </li>
        <li>
          {tracksCompleted.toLocaleString()} problem track
          {tracksCompleted === 1 ? '' : 's'} completed
        </li>
        <li>
          Current level: {recognitionLabel}
          {nextLabel &&
          recognitionProgressPercent != null &&
          recognitionProgressPercent < 100
            ? ` · ${recognitionProgressPercent}% towards ${nextLabel}`
            : null}
        </li>
      </ul>
      {highestEstimatedAwardGbp != null && highestEstimatedAwardGbp >= 1 ? (
        <p className="dashboard-progress-estimate">
          Highest estimated value: £{highestEstimatedAwardGbp.toFixed(2)}
        </p>
      ) : null}
    </div>
  );
}
