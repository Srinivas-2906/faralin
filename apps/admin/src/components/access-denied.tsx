import { Card, PageHeader } from '@faralin/ui';

export function AccessDenied() {
  return (
    <div className="page-section">
      <div className="container">
        <Card>
          <PageHeader
            title="Access required"
            description="This portal is for Faralin admins and support agents only. Contact platform admin if you need access."
          />
        </Card>
      </div>
    </div>
  );
}
