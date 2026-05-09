import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import Sidebar from './Sidebar';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import HelpCenter from './HelpCenter';
import PlaceholderTab from './PlaceholderTab';
import SearchView from './SearchView';
import HistoryView from './HistoryView';
import LikesView from './LikesView';
import MatchesView from './MatchesView';
import MatchCelebrationModal from './MatchCelebrationModal';
import { subscribeToNewMatches } from '../lib/chatService';
import { supabase } from '../lib/supabase';
import { IconMenu } from '../constants';
import type { MatchCandidate } from '../types';

// ============================================================================
// Dashboard (Phase 5 batch 3 update)
//
// MatchesView is now wired. The deep-link flow works:
//   1. User likes someone, mutual match fires
//   2. Celebration modal shows with "Send a Message" button
//   3. Click → switches to Matches tab AND auto-opens that specific chat
// ============================================================================

type Tab = 'search' | 'history' | 'likes' | 'matches' | 'standouts' | 'profile' | 'settings' | 'help';

interface DashboardProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, onToggleDarkMode }) => {
  const { profile, session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [pendingMatchOpenId, setPendingMatchOpenId] = useState<string | null>(null);
  const [matchCelebration, setMatchCelebration] = useState<{ matchId: string; candidate: MatchCandidate } | null>(null);

  // Global new-match subscription (works regardless of which tab is active)
  useEffect(() => {
    if (!session?.user.id) return;
    const myId = session.user.id;

    const cleanup = subscribeToNewMatches(myId, async (event) => {
      const otherId = event.userAId === myId ? event.userBId : event.userAId;

      const { data: row } = await supabase
        .from('profiles')
        .select('id, name, age, location, photo_urls, hidden_fields, subscription_tier, is_verified')
        .eq('id', otherId)
        .single();

      if (!row) return;

      const candidate: MatchCandidate = {
        id: row.id,
        name: row.name ?? '',
        age: row.age ?? 0,
        location: row.location ?? '',
        compatibilityScore: 0,
        tags: [],
        bio: '',
        imageUrls: row.photo_urls ?? [],
        hiddenFields: row.hidden_fields ?? [],
        subscriptionTier: (row.subscription_tier as 'FREE' | 'PRO') ?? 'FREE',
        isPremium: row.subscription_tier === 'PRO',
        isVerified: row.is_verified ?? false,
      };

      setMatchCelebration({ matchId: event.matchId, candidate });
    });

    return cleanup;
  }, [session?.user.id]);

  const handleNavigateToMatches = useCallback((matchId: string) => {
    setPendingMatchOpenId(matchId);
    setActiveTab('matches');
    setIsMobileMenuOpen(false);
  }, []);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919]">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const handleTabChange = (tab: Tab) => {
    // Clear deep-link when manually switching tabs (so MatchesView doesn't re-open old chat)
    if (tab !== 'matches') {
      setPendingMatchOpenId(null);
    }
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#191919] overflow-hidden relative font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-white/50 backdrop-blur-[10px] z-[60] md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isMobileMenuOpen}
        setIsOpen={setIsMobileMenuOpen}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeTab={activeTab === 'help' ? 'settings' : activeTab}
        onTabChange={handleTabChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
      />

      <main className="flex-1 flex flex-col h-full relative bg-white dark:bg-[#191919] min-w-0 overflow-hidden">
        <div className="flex-none flex items-center p-4 border-b border-gray-100 dark:border-zinc-800 z-20 bg-white dark:bg-[#191919]">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors mr-2"
          >
            <IconMenu />
          </button>
          <div className="font-bold text-gray-700 dark:text-gray-100 text-lg">
            <span className="md:hidden">ShaadiGPT</span>
            <span className="hidden md:block capitalize">
              {activeTab === 'search' ? 'Find Match'
                : activeTab === 'profile' ? 'My Profile'
                : activeTab === 'history' ? 'Search History'
                : activeTab === 'likes' ? 'Likes You'
                : activeTab === 'matches' ? 'Matches'
                : activeTab === 'standouts' ? 'Standouts'
                : activeTab === 'help' ? 'Help Center'
                : 'Settings'}
            </span>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'search' && <SearchView onNavigateToMatches={handleNavigateToMatches} />}
          {activeTab === 'history' && <HistoryView />}
          {activeTab === 'likes' && <LikesView />}
          {activeTab === 'matches' && <MatchesView initialMatchId={pendingMatchOpenId} />}
          {activeTab === 'standouts' && (
            <PlaceholderTab
              title="Daily Standouts"
              emoji="🌟"
              comingIn="Phase 5 (Batch 4)"
              description="A curated set of top picks in your area, refreshed daily."
            />
          )}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'settings' && (
            <SettingsView
              isDarkMode={isDarkMode}
              onToggleDarkMode={onToggleDarkMode}
              onNavigate={(t: string) => setActiveTab(t as Tab)}
            />
          )}
          {activeTab === 'help' && <HelpCenter />}
        </div>
      </main>

      {/* Global match celebration */}
      {matchCelebration && (
        <MatchCelebrationModal
          matchedWith={matchCelebration.candidate}
          matchId={matchCelebration.matchId}
          onClose={() => setMatchCelebration(null)}
          onChat={(matchId) => {
            setMatchCelebration(null);
            handleNavigateToMatches(matchId);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
