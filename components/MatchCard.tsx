import React from 'react';
import { IconCheck, IconZap } from '../constants';
import LikeButton from './LikeButton';
import type { MatchCandidate } from '../types';

// ============================================================================
// MatchCard (Phase 5 update)
//
// Adds a LikeButton overlay in the bottom-right of the card. The whole card
// is clickable to open the modal; the like button stops propagation so it
// only fires the like.
// ============================================================================

interface MatchCardProps {
  candidate: MatchCandidate;
  onClick: () => void;
  onMatched?: (matchId: string, candidate: MatchCandidate) => void;
  onLimitReached?: () => void;
  showLikeButton?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  candidate, onClick, onMatched, onLimitReached, showLikeButton = true,
}) => {
  const photo = candidate.imageUrls?.[0];
  const score = candidate.compatibilityScore;

  // Score color buckets
  const scoreColor =
    score >= 80 ? 'bg-green-500 text-white'
    : score >= 60 ? 'bg-blue-500 text-white'
    : score >= 40 ? 'bg-yellow-500 text-white'
    : 'bg-gray-400 text-white';

  // Note: changed root from <button> to <div> so we can nest interactive elements
  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 dark:hover:border-zinc-600 hover:shadow-md transition-all"
    >
      {/* Photo */}
      <div className="aspect-[3/4] bg-gray-100 dark:bg-zinc-800 overflow-hidden relative">
        {photo ? (
          <img
            src={photo}
            alt={candidate.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300 dark:text-zinc-700">👤</div>
        )}

        {/* Score chip */}
        {score > 0 && (
          <div className={`absolute top-2 right-2 ${scoreColor} px-2.5 py-1 rounded-full text-xs font-bold shadow-sm`}>
            {score}%
          </div>
        )}

        {/* Verified / Pro badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {candidate.isVerified && (
            <div className="bg-blue-500 text-white p-1 rounded-full" title="Verified">
              <IconCheck className="w-3 h-3" />
            </div>
          )}
          {candidate.isPremium && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-1 rounded-full" title="Pro user">
              <IconZap />
            </div>
          )}
        </div>

        {/* Bottom gradient + name + Like button */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            <h3 className="text-white font-bold text-base truncate">
              {candidate.name}{candidate.age ? `, ${candidate.age}` : ''}
            </h3>
            <p className="text-white/80 text-xs truncate">{candidate.location}</p>
          </div>
          {showLikeButton && (
            <LikeButton
              candidate={candidate}
              size="md"
              showSuperLike={false}
              onMatched={onMatched}
              onLimitReached={onLimitReached}
            />
          )}
        </div>
      </div>

      {/* Tags */}
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="p-3 flex flex-wrap gap-1.5">
          {candidate.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-900/40 truncate max-w-full"
              title={tag}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
