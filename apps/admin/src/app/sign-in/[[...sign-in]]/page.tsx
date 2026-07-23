import { SignIn } from '@clerk/nextjs';
import { authAppearance } from '@/lib/clerk-appearance';

export default function SignInPage() {
  return (
    <div className="auth-center admin-sign-in">
      <div className="admin-sign-in-layout">
        <aside className="admin-sign-in-brand">
          <p className="admin-sign-in-kicker">Faralin</p>
          <h1 className="admin-sign-in-title">Admin & support hub</h1>
          <p className="admin-sign-in-copy">
            Internal support ticketing for phone, email, and chat cases — plus platform
            administration for Faralin operators.
          </p>
          <p className="admin-sign-in-demo">
            Demo agent: <code>agent-1@faralin.kaana.in</code>
            <br />
            Demo admin: <code>admin@faralin.com</code>
          </p>
        </aside>
        <div className="auth-center-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p className="display-title" style={{ fontSize: '1.25rem' }}>
              Admin sign in
            </p>
            <p style={{ color: 'var(--faralin-muted)', marginTop: '0.5rem' }}>
              Admins and support agents only
            </p>
          </div>
          <SignIn
            routing="path"
            path="/sign-in"
            forceRedirectUrl="/dashboard"
            appearance={authAppearance}
          />
        </div>
      </div>
    </div>
  );
}
