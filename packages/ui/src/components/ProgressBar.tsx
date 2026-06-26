interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div>
      <div className="progress-header">
        <span>{label ?? 'Progress'}</span>
        <span>
          {current} of {total}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label ?? 'Progress'}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="step-indicator" aria-label="Setup progress">
      {steps.map((step, i) => (
        <div
          key={step}
          className={`step-dot${i < currentStep ? ' complete' : ''}${i === currentStep ? ' active' : ''}`}
          title={step}
          aria-label={`${step}${i === currentStep ? ' (current)' : i < currentStep ? ' (complete)' : ''}`}
        />
      ))}
    </div>
  );
}
