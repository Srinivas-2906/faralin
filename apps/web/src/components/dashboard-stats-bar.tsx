'use client';

import { InfoTooltip } from '@faralin/ui';
import { RECOGNITION_TIER_LABELS, type StudentRecognitionTier } from '@faralin/types';
import { STUDENT_HELP_COPY } from '@/lib/student-help-copy';

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

  const levelText =
    nextLabel &&
    recognitionProgressPercent != null &&
    recognitionProgressPercent < 100
      ? `${recognitionLabel} · ${recognitionProgressPercent}% to ${nextLabel}`
      : recognitionLabel;

  return (
    <div className="dashboard-progress-row" aria-label="Your Faralin progress">
      <div className="dashboard-progress-chip dashboard-progress-chip--primary">
        <span className="dashboard-progress-chip-value">
          {faralinsEarned.toLocaleString()}
        </span>
        <span className="dashboard-progress-chip-label">Faralins earned</span>
        <InfoTooltip label="About Faralins earned">{STUDENT_HELP_COPY.faralinsEarned}</InfoTooltip>
      </div>

      <div className="dashboard-progress-chip">
        <span className="dashboard-progress-chip-value">
          {assessmentsCompleted.toLocaleString()}
        </span>
        <span className="dashboard-progress-chip-label">
          assessment{assessmentsCompleted === 1 ? '' : 's'}
        </span>
      </div>

      <div className="dashboard-progress-chip">
        <span className="dashboard-progress-chip-value">
          {tracksCompleted.toLocaleString()}
        </span>
        <span className="dashboard-progress-chip-label">
          track{tracksCompleted === 1 ? '' : 's'}
        </span>
      </div>

      <div className="dashboard-progress-chip">
        <span className="dashboard-progress-chip-label">{levelText}</span>
        <InfoTooltip label="About your current level">{STUDENT_HELP_COPY.currentLevel}</InfoTooltip>
      </div>

      {highestEstimatedAwardGbp != null && highestEstimatedAwardGbp >= 1 ? (
        <div className="dashboard-progress-chip">
          <span className="dashboard-progress-chip-label">Up to</span>
          <span className="dashboard-progress-chip-value">
            £{highestEstimatedAwardGbp.toFixed(2)}
          </span>
          <InfoTooltip label="About highest estimated value">
            {STUDENT_HELP_COPY.highestEstimate}
          </InfoTooltip>
        </div>
      ) : null}
    </div>
  );
}
