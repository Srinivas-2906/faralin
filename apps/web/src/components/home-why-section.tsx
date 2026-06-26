import type { SVGProps } from 'react';

type EducationSymbol = 'book' | 'cap' | 'scroll';

const pillars: {
  index: string;
  title: string;
  hint: string;
  watermark: EducationSymbol;
}[] = [
  {
    index: '01',
    title: 'Honest recognition',
    hint: 'No gamification',
    watermark: 'book',
  },
  {
    index: '02',
    title: 'University-specific',
    hint: 'Partner-set rates',
    watermark: 'cap',
  },
  {
    index: '03',
    title: 'Conditional value',
    hint: 'On enrolment',
    watermark: 'scroll',
  },
];

function EducationWatermark({
  symbol,
  ...props
}: { symbol: EducationSymbol } & SVGProps<SVGSVGElement>) {
  if (symbol === 'cap') {
    return (
      <svg viewBox="0 0 32 22" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" {...props}>
        <path d="M16 4L2 10l14 6 14-6-14-6z" />
        <path d="M6 12v6c0 2.2 4.5 4 10 4s10-1.8 10-4v-6" />
        <path d="M30 10v8" />
        <circle cx="30" cy="20" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (symbol === 'book') {
    return (
      <svg viewBox="0 0 32 28" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" {...props}>
        <path d="M2 4c4-1 8-1 14 0v20c-6-1.2-10-1.2-14 0V4z" />
        <path d="M16 4c4-1 8-1 14 0v20c-4-1.2-8-1.2-14 0V4z" />
        <path d="M16 4v20" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 24" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" {...props}>
      <path d="M4 6c0-2 4-3 8-3h8c4 0 8 1 8 3v12c0 2-4 3-8 3h-8c-4 0-8-1-8-3V6z" />
      <path d="M4 6c-1.5 1-1.5 3 0 4" />
      <path d="M28 6c1.5 1 1.5 3 0 4" />
      <path d="M4 18c-1.5-1-1.5-3 0-4" />
      <path d="M28 18c1.5-1 1.5-3 0-4" />
      <path d="M10 10h12M10 14h8" />
    </svg>
  );
}

export function HomeWhySection() {
  return (
    <section className="home-section home-section--why" aria-labelledby="home-why-title">
      <div className="container-wide home-why-board">
        <header className="home-section-head">
          <div className="home-section-head-inner">
            <p className="home-section-eyebrow">Why Faralin</p>
            <h2 id="home-why-title" className="home-section-title">
              Recognition built on trust
            </h2>
          </div>
        </header>

        <div className="home-why-board-grid">
          {pillars.map(({ index, title, hint, watermark }, i) => (
            <article
              key={title}
              className={`home-why-board-cell${i === 1 ? ' home-why-board-cell--featured' : ''}`}
            >
              <EducationWatermark
                symbol={watermark}
                className={`home-why-board-watermark home-why-board-watermark--${watermark}`}
              />
              <span className="home-why-board-cell-index" aria-hidden="true">
                {index}
              </span>
              <div className="home-why-board-cell-copy">
                <h3 className="home-why-board-cell-title">{title}</h3>
                <p className="home-why-board-cell-hint">{hint}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
