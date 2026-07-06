'use client';

import Link from 'next/link';
import { Card, EmptyState, Badge } from '@faralin/ui';
import {
  SUBMISSION_TRUST_LABELS,
  TRACK_DIFFICULTY_LABELS,
  type PortfolioArtifactSummary,
} from '@faralin/types';

export function DashboardCompletedTracks({
  artifacts,
}: {
  artifacts: PortfolioArtifactSummary[];
}) {
  return (
    <section id="completed-tracks" className="dashboard-section dashboard-completed-tracks">
      <Card className="dashboard-completed-tracks-panel">
        <header className="dashboard-section-head">
          <h2 className="dashboard-section-title">Completed Problem Tracks</h2>
          {artifacts.length > 0 && (
            <Link href="/tracks" className="dashboard-section-link">
              Browse tracks →
            </Link>
          )}
        </header>

        {artifacts.length === 0 ? (
          <EmptyState
            compact
            message="Complete a Problem Track to see your recognition here."
          />
        ) : (
          <div className="portfolio-artifact-list">
            {artifacts.map((artifact) => (
              <Card key={artifact.id} className="portfolio-artifact-card portfolio-artifact-card--polished">
                <div className="portfolio-artifact-head">
                  <Badge>
                    {TRACK_DIFFICULTY_LABELS[
                      artifact.difficultyBand as keyof typeof TRACK_DIFFICULTY_LABELS
                    ] ?? artifact.difficultyBand}
                  </Badge>
                  <Badge variant="verified">
                    {SUBMISSION_TRUST_LABELS[
                      artifact.trustLevel as keyof typeof SUBMISSION_TRUST_LABELS
                    ] ?? artifact.trustLevel}
                  </Badge>
                </div>
                <h3>{artifact.title}</h3>
                <p className="text-muted">{artifact.subjectName}</p>
                <dl className="portfolio-artifact-stats">
                  <div>
                    <dt>Score</dt>
                    <dd>{artifact.rubricScore}%</dd>
                  </div>
                  <div>
                    <dt>Faralins</dt>
                    <dd>{artifact.faralinsEarned.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Completed</dt>
                    <dd>{new Date(artifact.completedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                {artifact.skillsDemonstrated?.length ? (
                  <p className="text-muted">
                    Skills: {artifact.skillsDemonstrated.join(', ')}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}

        {artifacts.length === 0 && (
          <p style={{ marginTop: '0.75rem' }}>
            <Link href="/tracks" className="dashboard-section-link">
              Start a Problem Track →
            </Link>
          </p>
        )}
      </Card>
    </section>
  );
}
