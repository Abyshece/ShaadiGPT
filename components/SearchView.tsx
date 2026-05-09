import React, { useState, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import { runSearch } from '../lib/matchingService';
import { saveSearch } from '../lib/searchHistoryService';
import { incrementSearchCount, computeSearchAllowance, computeVerificationStatus } from '../lib/profileService';
import MatchCard from './MatchCard';
import ProfileModal from './ProfileModal';
import VerificationBanner from './VerificationBanner';
import UpgradeModal from './UpgradeModal';
import FilterPanel from './FilterPanel';
import MatchCelebrationModal from './MatchCelebrationModal';
import { IconSearch, IconZap } from '../constants';
import type { MatchCandidate, FilterOptions } from '../types';

// ============================================================================
// SearchView (Phase 5 update)
//
// Adds match celebration modal handling — when a like causes a mutual match,
// the celebration appears.
// ============================================================================

interface SearchViewProps {
  onNavigateToMatches?: (matchId: string) => void;
}

const DEFAULT_FILTERS: FilterOptions = {
  isOnline: false,
  isVerified: false,
  isPremium: false,
};

const EXAMPLE_PROMPTS = [
  'Ambitious lawyer in Mumbai who loves hiking',
  'Vegetarian, spiritual, wants marriage in 1-2 years',
  'Creative artist who travels often and reads books',
  'Athletic engineer with secure attachment style',
  'Loves cooking, family-oriented, in Bangalore',
];

function countActiveFilters(f: FilterOptions): number {
  let n = 0;
  if (f.ageRange && (f.ageRange[0] !== 21 || f.ageRange[1] !== 45)) n++;
  if (f.neighborhood) n++;
  if (f.religion) n++;
  if (f.educationLevel) n++;
  if (f.datingIntention) n++;
  if (f.familyPlans) n++;
  if (f.children) n++;
  if (f.relationshipType) n++;
  if (f.drinking) n++;
  if (f.smoking) n++;
  if (f.marijuana) n++;
  if (f.drugs) n++;
  if (f.politics) n++;
  if (f.ethnicity) n++;
  if (f.isVerified) n++;
  if (f.isPremium) n++;
  if (f.hasInstagram) n++;
  if (f.hasLinkedin) n++;
  return n;
}

const SearchView: React.FC<SearchViewProps> = ({ onNavigateToMatches }) => {
  const { profile, session, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [results, setResults] = useState<MatchCandidate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [poolSize, setPoolSize] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [matchCelebration, setMatchCelebration] = useState<{ matchId: string; candidate: MatchCandidate } | null>(null);

  if (!profile || !session?.user.id) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>;
  }

  const allowance = computeSearchAllowance(profile);
  const verification = computeVerificationStatus(profile);
  const isLockedOut = verification.isLockedOut;
  const activeFilterCount = countActiveFilters(filters);

  const handleSearch = useCallback(async () => {
    if (!prompt.trim() && activeFilterCount === 0) {
      showToast('Type a prompt or set some filters', 'info');
      return;
    }
    if (isLockedOut) {
      showToast('Verify your account to search', 'error');
      return;
    }
    if (!allowance.allowed) {
      setShowUpgradeModal(true);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const output = await runSearch({
        searcherId: session.user.id,
        searcher: profile,
        prompt,
        filters,
      });

      setResults(output.candidates);
      setPoolSize(output.poolSize);

      await incrementSearchCount(session.user.id, profile);

      saveSearch(session.user.id, prompt, filters, output.candidates, output.poolSize)
        .catch((e) => console.warn('[SearchView] saveSearch failed:', e));

      await refreshProfile();

      if (output.candidates.length === 0) {
        showToast(`No matches found in pool of ${output.totalEligible}`, 'info');
      } else {
        showToast(`Found ${output.candidates.length} matches`, 'success');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Search failed';
      showToast(msg, 'error');
    } finally {
      setSearching(false);
    }
  }, [prompt, filters, profile, session.user.id, allowance.allowed, isLockedOut, activeFilterCount, refreshProfile, showToast]);

  const handleExampleClick = (ex: string) => setPrompt(ex);

  const handleMatched = (matchId: string, candidate: MatchCandidate) => {
    // Close any open profile modal first, then celebrate
    setSelectedCandidate(null);
    setMatchCelebration({ matchId, candidate });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-8 px-6 lg:px-12">
        {isLockedOut && <VerificationBanner verification={verification} />}

        {/* Search header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">Find Your Match</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Describe who you're looking for. Our algorithm scores every profile across 70+ attributes.
          </p>
        </div>

        {/* Daily-limit pill + filter button */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
            allowance.isPro
              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
              : allowance.allowed
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40'
          }`}>
            {allowance.isPro ? (
              <><IconZap /> Pro · Unlimited searches</>
            ) : allowance.allowed ? (
              <>{allowance.remaining} of 1 search remaining today</>
            ) : (
              <>Daily limit reached · resets in {allowance.resetInHours}h</>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!allowance.isPro && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-xs font-bold text-yellow-700 dark:text-yellow-400 hover:underline"
              >
                Upgrade to Pro →
              </button>
            )}

            <button
              onClick={() => setShowFilterPanel(true)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                activeFilterCount > 0
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600'
              }`}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Prompt textarea */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSearch();
              }
            }}
            disabled={searching || isLockedOut}
            placeholder="Describe your ideal match in your own words…"
            className="w-full p-5 text-base text-gray-900 dark:text-white bg-transparent outline-none resize-none min-h-[120px] placeholder:text-gray-400"
          />
          <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/50 px-4 py-3 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-[11px] text-gray-400">⌘ + Enter to search</span>
            <button
              onClick={handleSearch}
              disabled={searching || isLockedOut}
              className="bg-black dark:bg-white text-white dark:text-black px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                  Searching…
                </>
              ) : (
                <><IconSearch /> Search</>
              )}
            </button>
          </div>
        </div>

        {/* Example prompts */}
        {!hasSearched && (
          <div className="mb-10">
            <p className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-3">Try one of these</p>
            <div className="flex flex-wrap gap-2">
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
        )}

        {/* Results */}
        {hasSearched && (
          <div className="mt-8">
            {searching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No matches found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {activeFilterCount > 0
                    ? 'Try loosening your filters, or check that you\'ve completed enough of your profile to be matched.'
                    : 'Try a less specific prompt, or check that you\'ve completed enough of your profile to be matched.'}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Found <strong>{results.length}</strong> matches from a pool of <strong>{poolSize}</strong> eligible profiles
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((c) => (
                    <MatchCard
                      key={c.id}
                      candidate={c}
                      onClick={() => setSelectedCandidate(c)}
                      onMatched={handleMatched}
                      onLimitReached={() => setShowUpgradeModal(true)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Profile modal */}
      {selectedCandidate && (
        <ProfileModal
          candidate={selectedCandidate}
          isPro={profile.subscriptionTier === 'PRO'}
          onClose={() => setSelectedCandidate(null)}
          onUpgrade={() => { setSelectedCandidate(null); setShowUpgradeModal(true); }}
          onMatched={handleMatched}
        />
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal
          reason={!allowance.allowed ? 'daily_limit' : 'pro_feature'}
          resetInHours={allowance.resetInHours}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Filter panel */}
      <FilterPanel
        isOpen={showFilterPanel}
        initialFilters={filters}
        isPro={profile.subscriptionTier === 'PRO'}
        onApply={(f) => setFilters(f)}
        onClose={() => setShowFilterPanel(false)}
        onUpgrade={() => { setShowFilterPanel(false); setShowUpgradeModal(true); }}
      />

      {/* Match celebration */}
      {matchCelebration && (
        <MatchCelebrationModal
          matchedWith={matchCelebration.candidate}
          matchId={matchCelebration.matchId}
          onClose={() => setMatchCelebration(null)}
          onChat={(matchId) => {
            setMatchCelebration(null);
            if (onNavigateToMatches) {
              onNavigateToMatches(matchId);
            } else {
              showToast('Chat coming in Batch 3', 'info');
            }
          }}
        />
      )}
    </div>
  );
};

export default SearchView;
