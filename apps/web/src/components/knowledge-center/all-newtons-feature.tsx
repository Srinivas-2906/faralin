import Link from 'next/link';
import { ALL_NEWTONS_URL } from '@/lib/all-newtons';

export function AllNewtonsFeature({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`all-newtons-feature${compact ? ' all-newtons-feature--compact' : ''}`}>
      <div className="all-newtons-feature-inner">
        <p className="all-newtons-feature-eyebrow">Resource partner</p>
        <h2 className="all-newtons-feature-title">All Newtons</h2>
        <p className="all-newtons-feature-copy">
          Subject worksheets, exam guides, and reference materials — curated by All Newtons and
          highlighted here in the Knowledge Center.
        </p>
        <div className="all-newtons-feature-actions">
          <a
            href={ALL_NEWTONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open All Newtons →
          </a>
          {!compact && (
            <Link href="/knowledge-center/resources" className="all-newtons-feature-link">
              Browse resource categories
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
