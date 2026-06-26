import { SignUp } from '@clerk/nextjs';
import { authSignUpAppearance, authLocalization } from '@/lib/clerk-appearance';

export default function SignUpPage() {
  return (
    <div className="auth-split">
      <div className="auth-split-panel auth-split-visual" aria-hidden="true">
        <div
          className="auth-split-bg"
          style={{ backgroundImage: "url('/images/auth-panel.jpg')" }}
        />
        <div className="auth-split-overlay">
          <p className="display-title">Join Faralin</p>
          <p className="auth-split-tagline">Earn recognition from universities you choose.</p>
        </div>
      </div>
      <div className="auth-split-panel auth-split-form">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
          appearance={authSignUpAppearance}
          localization={authLocalization}
        />
      </div>
    </div>
  );
}
