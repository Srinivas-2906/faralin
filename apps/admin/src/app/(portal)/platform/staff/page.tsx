'use client';

import { useState } from 'react';
import { Alert, Card, PageHeader } from '@faralin/ui';
import { AccessDenied } from '@/components/access-denied';
import { AdminPageSkeleton } from '@/components/admin-page-skeleton';
import { useAdminData } from '@/components/admin-provider';
import { useAdminApi } from '@/lib/use-admin-api';

export default function PlatformStaffPage() {
  const { data: universities, loading, accessDenied } = useAdminData<
    Array<{ id: string; name: string }>
  >('/admin/universities');
  const { adminFetch } = useAdminApi();
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUniversityId, setStaffUniversityId] = useState('');
  const [staffJobTitle, setStaffJobTitle] = useState('');
  const [staffMessage, setStaffMessage] = useState('');
  const [staffError, setStaffError] = useState('');

  async function inviteStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffError('');
    setStaffMessage('');
    try {
      await adminFetch('/admin/university-staff', {
        method: 'POST',
        body: JSON.stringify({
          email: staffEmail,
          universityId: staffUniversityId,
          jobTitle: staffJobTitle || undefined,
        }),
      });
      setStaffMessage(
        `Invited ${staffEmail}. Ask them to accept the Clerk invite, then sign in at the university portal.`,
      );
      setStaffEmail('');
      setStaffJobTitle('');
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Failed to invite staff');
    }
  }

  if (accessDenied) return <AccessDenied />;
  if (loading && !universities) return <AdminPageSkeleton rows={5} />;

  return (
    <div className="page-section">
      <div className="container">
        <PageHeader title="University staff invites" description="Create pending university staff accounts" />
        <Card>
          <p style={{ color: 'var(--faralin-muted)', marginBottom: '1rem' }}>
            Creates a pending staff account. Send a Clerk invite to the same email, then staff sign in at
            the university portal.
          </p>
          {staffError ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="error">{staffError}</Alert>
            </div>
          ) : null}
          {staffMessage ? (
            <div style={{ marginBottom: '1rem' }}>
              <Alert variant="success">{staffMessage}</Alert>
            </div>
          ) : null}
          <form className="form-stack" style={{ maxWidth: '480px' }} onSubmit={inviteStaff}>
            <div className="form-row">
              <label htmlFor="staffEmail">Email</label>
              <input
                id="staffEmail"
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="staffUniversity">University</label>
              <select
                id="staffUniversity"
                required
                value={staffUniversityId}
                onChange={(e) => setStaffUniversityId(e.target.value)}
              >
                <option value="">Select university</option>
                {(universities ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="staffJobTitle">Job title</label>
              <input
                id="staffJobTitle"
                value={staffJobTitle}
                onChange={(e) => setStaffJobTitle(e.target.value)}
                placeholder="Widening Participation Officer"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              Create staff account
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
