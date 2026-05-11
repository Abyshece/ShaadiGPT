import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider, useToast } from './lib/useToast';
import Auth from './components/Auth';
import EmailVerification from './components/EmailVerification';
import OnboardingShell from './components/onboarding/OnboardingShell';
import Dashboard from './components/Dashboard';

// ============================================================================
// App (hotfix)
//
// Properly handles every state of profile loading so the UI never gets
// trapped indefinitely:
//
//   1. session=null            → Auth screen
//   2. session=ok, profileError → ProfileErrorScreen with retry + sign-out
//   3. session=ok, profileMissing → ProfileMissingScreen with "Create" button
//   4. session=ok, profileLoading still in flight → brief spinner
//   5. session=ok, profile loaded, onboarding incomplete → onboarding
//   6. session=ok, profile loaded, onboarding done → Dashboard
// ============================================================================

const AppRouter: React.FC<{
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}> = ({ isDarkMode, onToggleDarkMode }) => {
  const {
    session, profileRow, loading, profileLoading, profileError, profileMissing,
    retryLoadProfile, healMissingProfile, signOut,
  } = useAuth();
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(null);

  // 1. Top-level bootstrap loading
  if (loading) {
    return <FullScreenLoader label="Loading…" />;
  }

  // 2. Not signed in
  if (!session && !pendingSignupEmail) {
    return (
      <Auth
        onSignupInitiated={(email) => setPendingSignupEmail(email)}
        onSignInSuccess={() => { /* AuthContext will pick up session */ }}
      />
    );
  }

  // 3. Mid-signup, awaiting email verification
  if (!session && pendingSignupEmail) {
    return (
      <EmailVerification
        email={pendingSignupEmail}
        onVerified={() => setPendingSignupEmail(null)}
        onBack={() => setPendingSignupEmail(null)}
      />
    );
  }

  // 4. Profile load errored — surface actual error with retry
  if (profileError && !profileLoading) {
    return <ProfileErrorScreen error={profileError} onRetry={retryLoadProfile} onSignOut={signOut} />;
  }

  // 5. Profile row missing in DB — offer to create one
  if (profileMissing && !profileLoading) {
    return <ProfileMissingScreen onHeal={healMissingProfile} onSignOut={signOut} />;
  }

  // 6. Still loading the profile — but bounded (8s timeout inside AuthContext)
  if (!profileRow) {
    return <FullScreenLoader label="Loading your profile…" />;
  }

  // 7. Onboarding flow
  if (!profileRow.onboarding_complete) {
    return <OnboardingShell onComplete={() => { /* AuthContext refreshes */ }} />;
  }

  // 8. Main app
  return <Dashboard isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} />;
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <ToastProvider>
      <AuthProvider>
        <div className={isDarkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-200">
            <AppRouter isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode((v) => !v)} />
          </div>
        </div>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;

// ============================================================================
// Helper screens
// ============================================================================

const FullScreenLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#191919] gap-3">
    <div className="w-8 h-8 border-3 border-gray-200 dark:border-zinc-700 border-t-black dark:border-t-white rounded-full animate-spin" />
    <div className="text-gray-400 text-sm">{label}</div>
  </div>
);

const ProfileErrorScreen: React.FC<{
  error: string;
  onRetry: () => Promise<void>;
  onSignOut: () => Promise<void>;
}> = ({ error, onRetry, onSignOut }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  // Detect common causes to give actionable hints
  const lower = error.toLowerCase();
  let hint = '';
  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('network')) {
    hint = 'This looks like a network issue. Check that you can reach the internet and try again.';
  } else if (lower.includes('jwt') || lower.includes('expired') || lower.includes('invalid') || lower.includes('401')) {
    hint = 'Your session may have expired. Sign out and back in.';
  } else if (lower.includes('row-level security') || lower.includes('rls')) {
    hint = 'A database permission rule is blocking access. This is a server-side issue.';
  } else if (lower.includes('cors')) {
    hint = 'A cross-origin issue is blocking the request. Check your Supabase project URL.';
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919] p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/40 rounded-xl shadow-sm p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Couldn't load your profile
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {error}
        </p>
        {hint && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4 italic">
            {hint}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onSignOut}
            className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {retrying ? 'Retrying…' : 'Try again'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-4">
          Open DevTools → Console for more detail.
        </p>
      </div>
    </div>
  );
};

const ProfileMissingScreen: React.FC<{
  onHeal: () => Promise<{ error: string | null }>;
  onSignOut: () => Promise<void>;
}> = ({ onHeal, onSignOut }) => {
  const [healing, setHealing] = useState(false);
  const [healError, setHealError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleHeal = async () => {
    setHealing(true);
    setHealError(null);
    const { error } = await onHeal();
    setHealing(false);
    if (error) {
      setHealError(error);
      return;
    }
    showToast('Profile created — welcome!', 'success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919] p-6">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-2xl">
          👋
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Let's finish setting you up
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Your account is verified but a profile hasn't been created yet. Click below to create one and start onboarding.
        </p>
        {healError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-xs rounded-lg p-3 mb-4 text-left">
            <strong>Couldn't create:</strong> {healError}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onSignOut}
            className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
          <button
            onClick={handleHeal}
            disabled={healing}
            className="flex-1 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {healing ? 'Creating…' : 'Create profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
