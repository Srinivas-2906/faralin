'use client';

import Link from 'next/link';
import { Card, PageHeader } from '@faralin/ui';

export default function SupportPage() {
  return (
    <div className="page-section">
      <div className="container">
        <Card>
          <PageHeader
            title="Help centre"
            description="Get answers about your account, assessments, Faralins, and university applications."
          />
          <ul style={{ margin: '1rem 0', paddingLeft: '1.25rem', color: 'var(--faralin-muted)' }}>
            <li>Ask our assistant common questions instantly</li>
            <li>Escalate to a live support agent when you need more help</li>
            <li>Track your open support cases in one place</li>
          </ul>
          <Link href="/support/chat" className="btn btn-primary">
            Start a conversation
          </Link>
        </Card>
      </div>
    </div>
  );
}
