'use client';

import { useState } from 'react';
import { Alert, Card, EmptyState, PageHeader, ResponsiveTable } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

export default function PlatformAgentsPage() {
  const { data, loading, error, accessDenied, refresh } = useAdminData<
    Array<{
      id: string;
      email: string;
      role: string;
      displayName: string | null;
      jobTitle: string | null;
      openTicketCount: number;
    }>
  >('/support/agents');
  const { adminFetch } = useAdminApi();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setMessage('');
    try {
      await adminFetch('/support/agents', {
        method: 'POST',
        body: JSON.stringify({
          email,
          displayName: displayName || undefined,
          jobTitle: jobTitle || undefined,
        }),
      });
      setMessage(`Created pending agent ${email}. Provision Clerk access for the same email.`);
      setEmail('');
      setDisplayName('');
      setJobTitle('');
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create agent');
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading && !data) return <AdminPageSkeleton rows={6} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="Support agents" description="Agent roster and workload" />

        <Card style={{ marginBottom: 'var(--section-gap)' }}>
          {error ? (
            <PageHeader title="Support agents" description={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState compact message="No support agents configured." />
          ) : (
            <ResponsiveTable
              columns={[
                { key: 'name', header: 'Name', render: (a) => a.displayName ?? '—' },
                { key: 'email', header: 'Email', render: (a) => a.email },
                { key: 'role', header: 'Role', render: (a) => a.role },
                { key: 'title', header: 'Title', render: (a) => a.jobTitle ?? '—' },
                { key: 'open', header: 'Open tickets', render: (a) => a.openTicketCount },
              ]}
              data={data}
              getRowKey={(a) => a.id}
            />
          )}
        </Card>

        <Card>
          <h2 className="section-title">Add support agent</h2>
          {formError ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{formError}</Alert>
            </div>
          ) : null}
          {message ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="success">{message}</Alert>
            </div>
          ) : null}
          <form className="form-stack" style={{ maxWidth: '480px' }} onSubmit={createAgent}>
            <div className="form-row">
              <label htmlFor="agentEmail">Email</label>
              <input
                id="agentEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="agentDisplayName">Display name</label>
              <input
                id="agentDisplayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="agentJobTitle">Job title</label>
              <input
                id="agentJobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Support Agent"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Create agent account
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
