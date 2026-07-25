interface DashboardStatsBarProps {
  totalFaralins: number;
  estimatedBursaryGbp: number;
  tracksCompleted: number;
  assessmentsCompleted: number;
  verifiedTotal: number;
  hearEligibleFaralins: number;
  partnerUniversityCount: number;
}

export function DashboardStatsBar({
  totalFaralins,
  estimatedBursaryGbp,
  tracksCompleted,
  assessmentsCompleted,
  verifiedTotal,
  hearEligibleFaralins,
  partnerUniversityCount,
}: DashboardStatsBarProps) {
  const stats = [
    {
      label: 'Total Faralins',
      value: totalFaralins.toLocaleString(),
      hint:
        partnerUniversityCount > 0
          ? `Combined across ${partnerUniversityCount} partner ${
              partnerUniversityCount === 1 ? 'university' : 'universities'
            } — each keeps its own recognition balance.`
          : undefined,
    },
    {
      label: 'Est. bursary',
      value: `£${estimatedBursaryGbp.toFixed(2)}`,
      accent: true,
    },
    { label: 'Problem tracks', value: tracksCompleted.toLocaleString() },
    { label: 'Assessments', value: assessmentsCompleted.toLocaleString() },
    { label: 'Verified', value: verifiedTotal.toLocaleString() },
    { label: 'HEAR eligible', value: hearEligibleFaralins.toLocaleString() },
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
