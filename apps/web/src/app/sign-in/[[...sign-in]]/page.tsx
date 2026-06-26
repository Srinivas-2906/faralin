import { SignIn } from '@clerk/nextjs';
import { authAppearance, authLocalization } from '@/lib/clerk-appearance';

export default function SignInPage() {
  return (
    <div className="auth-split">
      <div className="auth-split-panel auth-split-visual" aria-hidden="true">
        <div
          className="auth-split-bg"
          style={{ backgroundImage: "url('/images/auth-panel.jpg')" }}
        />
        <div className="auth-split-overlay">
          <p className="display-title">Welcome back</p>
          <p className="auth-split-tagline">Your recognition journey continues.</p>
        </div>
      </div>
      <div className="auth-split-panel auth-split-form">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/dashboard"
          appearance={authAppearance}
          localization={authLocalization}
        />
      </div>
    </div>
  );
}
