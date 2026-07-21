import { SignIn } from '@clerk/nextjs';
import { authAppearance } from '@/lib/clerk-appearance';

export default function SignInPage() {
  return (
    <div className="auth-center">
      <div className="auth-center-card">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p className="display-title" style={{ fontSize: '1.5rem' }}>
            University portal
          </p>
          <p style={{ color: 'var(--faralin-muted)', marginTop: '0.5rem' }}>
            Sign in with your staff account
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
  );
}
