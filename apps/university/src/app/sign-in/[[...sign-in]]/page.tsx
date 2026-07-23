import { SignIn } from '@clerk/nextjs';
import { authAppearance } from '@/lib/clerk-appearance';

export default function SignInPage() {
  return (
    <div className="auth-center portal-sign-in">
      <div className="portal-sign-in-layout">
        <aside className="portal-sign-in-brand">
          <p className="portal-sign-in-kicker">Faralin</p>
          <h1 className="portal-sign-in-title">University staff portal</h1>
          <p className="portal-sign-in-copy">
            Access anonymous student insights, admissions pipeline data, and content
            publishing for your university.
          </p>
          <p className="portal-sign-in-demo">
            Demo login: <code>staff-oxford@faralin.kaana.in</code>
          </p>
        </aside>
        <div className="auth-center-card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p className="display-title" style={{ fontSize: '1.25rem' }}>
              Staff sign in
            </p>
            <p style={{ color: 'var(--faralin-muted)', marginTop: '0.5rem' }}>
              Staff access only
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
