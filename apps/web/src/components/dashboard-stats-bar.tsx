interface DashboardStatsBarProps {
  coreFaralins: number;
  estimatedBursaryGbp: number;
  tracksCompleted: number;
  assessmentsCompleted: number;
  verifiedTotal: number;
  hearEligibleFaralins: number;
  partnerUniversityCount: number;
  projectionCount?: number;
}

export function DashboardStatsBar({
  coreFaralins,
  estimatedBursaryGbp,
  tracksCompleted,
  assessmentsCompleted,
  verifiedTotal,
  hearEligibleFaralins,
  partnerUniversityCount,
  projectionCount = 0,
}: DashboardStatsBarProps) {
  const showLegacyVerified = coreFaralins <= 0 && verifiedTotal > 0;

  const stats = [
    {
      label: 'Core Faralins',
      value: coreFaralins.toLocaleString(),
      hint:
        'Your portable achievement record — independent of which universities you follow.',
    },
    {
      label: 'Est. conditional award',
      value:
        projectionCount > 1
          ? `Up to £${estimatedBursaryGbp.toFixed(2)}`
          : `£${estimatedBursaryGbp.toFixed(2)}`,
      accent: true,
      hint:
        partnerUniversityCount > 0
          ? `Based on current rules at ${partnerUniversityCount} followed ${
              partnerUniversityCount === 1 ? 'university' : 'universities'
            }. Only your enrolled university can confirm an award.`
          : undefined,
    },
    { label: 'Problem tracks', value: tracksCompleted.toLocaleString() },
    { label: 'Assessments', value: assessmentsCompleted.toLocaleString() },
    ...(showLegacyVerified
      ? [
          {
            label: 'Verified (migrating)',
            value: verifiedTotal.toLocaleString(),
            hint: 'Previous per-university totals while Core Faralins are being migrated.',
          },
        ]
      : []),
    {
      label: 'HEAR eligible',
      value: hearEligibleFaralins.toLocaleString(),
    },
  ];

  return (
    <div className="dashboard-stats" aria-label="Dashboard statistics">
      {stats.map((stat) => (
        <div key={stat.label} className="dashboard-stat">
          <span
            className={`dashboard-stat-value${stat.accent ? ' dashboard-stat-value--accent' : ''}`}
          >
            {stat.value}
          </span>
          <span className="dashboard-stat-label">{stat.label}</span>
          {stat.hint ? <span className="dashboard-stat-hint">{stat.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}
