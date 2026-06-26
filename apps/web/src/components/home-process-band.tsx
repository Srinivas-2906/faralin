import type { SVGProps } from 'react';

type ProcessSymbol = 'campus' | 'clipboard' | 'medal' | 'unlockDoc';

const steps: { title: string; symbol: ProcessSymbol }[] = [
  { title: 'Choose universities', symbol: 'campus' },
  { title: 'Take assessments', symbol: 'clipboard' },
  { title: 'Earn Faralins', symbol: 'medal' },
  { title: 'Unlock on enrolment', symbol: 'unlockDoc' },
];

function ProcessIllustration({
  symbol,
  ...props
}: { symbol: ProcessSymbol } & SVGProps<SVGSVGElement>) {
  if (symbol === 'campus') {
    return (
      <svg viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true" {...props}>
        <path d="M3 28V13l13-9 13 9v15" />
        <path d="M9 28V17h5v11M18 28V17h5v11" />
        <path d="M3 13h26" />
        <path d="M16 4v5" />
        <circle cx="16" cy="2.5" r="1.25" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (symbol === 'clipboard') {
    return (
      <svg viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true" {...props}>
        <path d="M9 5h14a2 2 0 0 1 2 2v21H7V7a2 2 0 0 1 2-2z" />
        <path d="M11 5V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
        <path d="M10 14l2.5 2.5L16 13" />
        <path d="M18 14h6" />
        <path d="M10 20l2.5 2.5L16 19" />
        <path d="M18 20h6" />
      </svg>
    );
  }

  if (symbol === 'medal') {
    return (
      <svg viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true" {...props}>
        <path d="M10 3l3 9-3 2-3-2 3-9zM22 3l3 9-3 2-3-2 3-9z" />
        <circle cx="16" cy="21" r="7.5" />
        <path d="M16 18v3l2 2" />
        <circle cx="16" cy="21" r="4.75" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" aria-hidden="true" {...props}>
      <path d="M7 9h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2z" />
      <path d="M12 9v14" />
      <circle cx="7" cy="16" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="25" cy="16" r="1.35" fill="currentColor" stroke="none" />
      <path d="M15 16l2.5 2.5L22 14" />
    </svg>
  );
}

export function HomeProcessBand() {
  return (
    <section className="home-process-band" aria-label="How Faralin works">
      <div className="container-wide">
        <div className="home-process-inner">
          {steps.map(({ title, symbol }) => (
            <article key={title} className="home-process-step">
              <div className="home-process-illustration-wrap">
                <ProcessIllustration
                  symbol={symbol}
                  className={`home-process-illustration home-process-illustration--${symbol}`}
                />
              </div>
              <h2 className="home-process-title">{title}</h2>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
