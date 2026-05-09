import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import { listLikesReceived, likeReceivedToCandidate } from '../lib/likesService';
import LikedYouCard from './LikedYouCard';
import ProfileModal from './ProfileModal';
import UpgradeModal from './UpgradeModal';
import MatchCelebrationModal from './MatchCelebrationModal';
import { IconHeart, IconStar, IconZap } from '../constants';
import type { LikeReceived } from '../lib/likesService';
import type { MatchCandidate } from '../types';

// ============================================================================
// LikesView
//
// "Likes You" tab. Shows incoming likes. Free users see blurred previews.
// Pro users see everyone clearly and can like back to instantly match.
// ============================================================================

const LikesView: React.FC = () => {
  const { profile, session } = useAuth();
  const { showToast } = useToast();

  const [likes, setLikes] = useState<LikeReceived[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<MatchCandidate | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [matchCelebration, setMatchCelebration] = useState<{ matchId: string; candidate: MatchCandidate } | null>(null);

  const fetchLikes = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    const { likes, error } = await listLikesReceived(session.user.id);
    setLoading(false);
    if (error) {
      showToast(`Couldn't load likes: ${error}`, 'error');
      return;
    }
    setLikes(likes);
  }, [session?.user.id, showToast]);

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  if (!profile) {
    return <div className="p-12 text-center text-gray-400">Loading…</div>;
  }

  const isPro = profile.subscriptionTier === 'PRO';
  const superLikeCount = likes.filter((l) => l.isSuperLike).length;
  const regularCount = likes.length - superLikeCount;

  const handleMatched = (matchId: string, candidate: MatchCandidate) => {
    setSelectedCandidate(null);
    setMatchCelebration({ matchId, candidate });
    // Refresh — the like is now a match, so it shouldn't appear in the inbox anymore
    setTimeout(fetchLikes, 500);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto py-8 px-6 lg:px-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">Likes You</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isPro
              ? 'These people liked you. Like back to instantly match.'
              : 'These people liked you. Upgrade to Pro to see who they are and like back.'}
          </p>
        </div>

        {/* Stats badges */}
        {!loading && likes.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-900/40">
              <IconHeart /> {regularCount} {regularCount === 1 ? 'like' : 'likes'}
            </div>
            {superLikeCount > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                <IconStar /> {superLikeCount} super {superLikeCount === 1 ? 'like' : 'likes'}
              </div>
            )}
          </div>
        )}

        {/* Pro upsell banner for free users with likes */}
        {!isPro && !loading && likes.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-4">
            <div className="text-yellow-500 flex-shrink-0"><IconZap /></div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">
                {likes.length} {likes.length === 1 ? 'person likes' : 'people like'} you
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Upgrade to Pro to see them clearly and like them back to instantly match.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:opacity-90 flex-shrink-0"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : likes.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800">
            <div className="text-5xl mb-4">💌</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No likes yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Complete your profile and start liking others. The more active you are, the more visible you become.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {likes.map((like) => (
              <LikedYouCard
                key={like.likeId}
                like={like}
                isPro={isPro}
                onView={(c) => setSelectedCandidate(c)}
                onUpgrade={() => setShowUpgradeModal(true)}
                onMatched={handleMatched}
              />
            ))}
          </div>
        )}
      </div>

      {/* Profile modal */}
      {selectedCandidate && (
        <ProfileModal
          candidate={selectedCandidate}
          isPro={isPro}
          onClose={() => setSelectedCandidate(null)}
          onUpgrade={() => { setSelectedCandidate(null); setShowUpgradeModal(true); }}
        />
      )}

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradeModal
          reason="pro_feature"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}

      {/* Match celebration */}
      {matchCelebration && (
        <MatchCelebrationModal
          matchedWith={matchCelebration.candidate}
          matchId={matchCelebration.matchId}
          onClose={() => setMatchCelebration(null)}
          onChat={(matchId) => {
            setMatchCelebration(null);
            // Phase 5 batch 3: switch to matches tab + open chat
            // For now we just close — Batch 3 wires this up
            showToast('Chat coming in Batch 3', 'info');
          }}
        />
      )}
    </div>
  );
};

export default LikesView;
