import React, { useState } from 'react';
import Auth from './Auth';
import { IconSearch } from '../constants';

// ============================================================================
// LandingView
//
// Public-facing landing page shown to logged-out users. The prompt input is
// the focal hero element. When the user types something and clicks Search,
// we save their prompt to sessionStorage and pop the Auth modal. After they
// sign up / sign in, the SearchView auto-loads with their prompt pre-filled
// and runs the search immediately.
// ============================================================================

const PENDING_PROMPT_KEY = 'shaadigpt_pending_prompt';

const EXAMPLE_PROMPTS = [
  'Ambitious lawyer in Mumbai who loves hiking',
  'Vegetarian, spiritual, wants marriage in 1-2 years',
  'Creative artist who travels often',
  'Athletic engineer with secure attachment',
  'Loves cooking, family-oriented, in Bangalore',
];

interface LandingViewProps {
  onSignupInitiated: (email: string) => void;
  onShowLegal: (page: 'terms' | 'privacy') => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onSignupInitiated, onShowLegal }) => {
  const [prompt, setPrompt] = useState('');
  const [showAuth, setShowAuth] = useState(false);

  const handleSearchAttempt = () => {
    // Save the prompt so SearchView can pick it up post-auth
    if (prompt.trim()) {
      sessionStorage.setItem(PENDING_PROMPT_KEY, prompt.trim());
    }
    setShowAuth(true);
  };

  const handleExampleClick = (ex: string) => {
    setPrompt(ex);
    // Don't auto-trigger auth — let the user click Search themselves
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#191919]">
      {/* Top bar — minimal */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 select-none">
          <span className="text-2xl">💍</span>
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">ShaadiGPT</span>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {/* Headline */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
              Find your match.
            </h1>
            <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Describe the person you're looking for. Our algorithm scores every profile across 70+ attributes.
            </p>
          </div>

          {/* Prompt input */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSearchAttempt();
                }
              }}
              placeholder="Describe your ideal match…"
              rows={3}
              className="w-full p-5 text-base text-gray-900 dark:text-white bg-transparent outline-none resize-none placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
              <span className="text-[11px] text-gray-400">⌘ + Enter to search</span>
              <button
                onClick={handleSearchAttempt}
                className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <IconSearch /> Search
              </button>
            </div>
          </div>

          {/* Example prompts */}
          <div className="mt-6">
            <p className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-3 text-center">Try one of these</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {EXAMPLE_PROMPTS.map((ex) => (
                <button
                  key={ex}
                  onClick={() => handleExampleClick(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Trust line */}
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-10">
            Free to use · Verified profiles · Built for serious relationships
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-zinc-800 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-5 text-xs text-gray-400">
          <button onClick={() => onShowLegal('terms')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Terms
          </button>
          <button onClick={() => onShowLegal('privacy')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Privacy
          </button>
          <span>© 2026 ShaadiGPT</span>
        </div>
      </footer>

      {/* Auth modal — rendered as overlay when triggered.
          When signup is initiated, the email flows up to App which unmounts
          LandingView and renders EmailVerification. We don't handle that here. */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSignupInitiated={(email) => {
            setShowAuth(false);          // Close our modal; App will show EmailVerification
            onSignupInitiated(email);
          }}
          onSignInSuccess={() => {
            // Auth context picks up the session, App.tsx unmounts LandingView,
            // and SearchView reads the pending prompt from sessionStorage on mount
            setShowAuth(false);
          }}
          onShowLegal={onShowLegal}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// AuthModal — wraps the existing Auth component in a centered modal
// ----------------------------------------------------------------------------

interface AuthModalProps {
  onClose: () => void;
  onSignupInitiated: (email: string) => void;
  onSignInSuccess: () => void;
  onShowLegal: (page: 'terms' | 'privacy') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  onClose, onSignupInitiated, onSignInSuccess, onShowLegal,
}) => {
  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-gray-200 dark:border-zinc-800 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <Auth
          onSignupInitiated={onSignupInitiated}
          onSignInSuccess={onSignInSuccess}
          onClose={onClose}
          onShowLegal={onShowLegal}
        />
      </div>
    </div>
  );
};

export default LandingView;
