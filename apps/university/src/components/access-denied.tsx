import { Card, PageHeader } from '@faralin/ui';

export function AccessDenied() {
  return (
    <div className="page-section">
      <div className="container">
        <Card>
          <PageHeader
            title="Access required"
            description="This portal is for university staff only. Contact Faralin admin if you need access."
          />
        </Card>
      </div>
    </div>
  );
}
