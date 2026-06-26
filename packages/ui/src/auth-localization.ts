/** Faralin copy overrides for auth UI — no third-party branding in user-facing text. */
export const authLocalization = {
  signIn: {
    start: {
      title: 'Sign in to Faralin',
      subtitle: 'Continue your recognition journey',
      actionText: "Don't have an account?",
      actionLink: 'Sign up',
    },
  },
  signUp: {
    start: {
      title: 'Create your Faralin account',
      subtitle: 'Join partner universities and start earning recognition',
      actionText: 'Already have an account?',
      actionLink: 'Sign in',
    },
  },
  userButton: {
    action__manageAccount: 'Account',
    action__signOut: 'Sign out',
  },
  userProfile: {
    navbar: {
      title: 'Account',
      description: 'Manage your Faralin profile',
    },
  },
} as const;
