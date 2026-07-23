interface DashboardStatsBarProps {
  totalFaralins: number;
  estimatedBursaryGbp: number;
  tracksCompleted: number;
  assessmentsCompleted: number;
  verifiedTotal: number;
  hearEligibleFaralins: number;
}

export function DashboardStatsBar({
  totalFaralins,
  estimatedBursaryGbp,
  tracksCompleted,
  assessmentsCompleted,
  verifiedTotal,
  hearEligibleFaralins,
}: DashboardStatsBarProps) {
  const stats = [
    { label: 'Total Faralins', value: totalFaralins.toLocaleString() },
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
        </div>
      ))}
    </div>
  );
}
