import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './lib/useToast';
import Auth from './components/Auth';
import EmailVerification from './components/EmailVerification';
import OnboardingShell from './components/onboarding/OnboardingShell';
import Dashboard from './components/Dashboard';

// ============================================================================
// App
// ============================================================================

const AppRouter: React.FC<{
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}> = ({ isDarkMode, onToggleDarkMode }) => {
  const { session, profileRow, loading } = useAuth();
  const [pendingSignupEmail, setPendingSignupEmail] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919]">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!session && !pendingSignupEmail) {
    return (
      <Auth
        onSignupInitiated={(email) => setPendingSignupEmail(email)}
        onSignInSuccess={() => { /* AuthContext will pick up session */ }}
      />
    );
  }

  if (!session && pendingSignupEmail) {
    return (
      <EmailVerification
        email={pendingSignupEmail}
        onVerified={() => setPendingSignupEmail(null)}
        onBack={() => setPendingSignupEmail(null)}
      />
    );
  }

  if (!profileRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919]">
        <div className="text-gray-400 text-sm">Setting up your profile…</div>
      </div>
    );
  }

  if (!profileRow.onboarding_complete) {
    return <OnboardingShell onComplete={() => { /* AuthContext refreshes, this re-renders */ }} />;
  }

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
