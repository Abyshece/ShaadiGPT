import React, { useState, useEffect } from 'react';
import CompatibilityReport from './CompatibilityReport';
import LikeButton from './LikeButton';
import BlockReportModal from './BlockReportModal';
import { IconX, IconCheck, IconZap, IconChevronLeft, IconChevronRight } from '../constants';
import type { MatchCandidate } from '../types';

interface ProfileModalProps {
  candidate: MatchCandidate;
  isPro: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onMatched?: (matchId: string, candidate: MatchCandidate) => void;
  showLikeButton?: boolean;  // false on the My Profile preview, true on search results
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  candidate, isPro, onClose, onUpgrade, onMatched, showLikeButton = true,
}) => {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState<null | 'block' | 'report'>(null);
  const photos = candidate.imageUrls ?? [];
  const hidden = candidate.hiddenFields ?? [];

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Helper to render a field if it has a value and isn't hidden
  const Field = ({ k, label }: { k: keyof MatchCandidate; label: string }) => {
    if (hidden.includes(k as string)) return null;
    const val = candidate[k];
    if (!val || val === 'Not specified') return null;
    return (
      <div className="flex justify-between py-1.5 text-sm border-b border-gray-100 dark:border-zinc-800/50 last:border-0">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-gray-900 dark:text-gray-200 font-medium text-right truncate max-w-[60%]">{String(val)}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto lg:overflow-hidden border border-gray-200 dark:border-zinc-800 relative flex flex-col lg:grid lg:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-8 lg:top-3 lg:right-3 z-30 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 shadow-md lg:bg-white/90 lg:dark:bg-zinc-800/90 lg:text-gray-700 lg:dark:text-gray-200 lg:hover:bg-white lg:dark:hover:bg-zinc-700"
          aria-label="Close"
        >
          <IconX />
        </button>

        {/* Overflow menu (top-left of right pane) */}
        {showLikeButton && (
          <div className="absolute top-5 left-8 lg:top-3 lg:left-3 lg:left-[calc(50%+12px)] z-30">
            <button
              onClick={(e) => { e.stopPropagation(); setShowOverflowMenu((v) => !v); }}
              className="p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 shadow-md lg:bg-white/90 lg:dark:bg-zinc-800/90 lg:text-gray-700 lg:dark:text-gray-200 lg:hover:bg-white lg:dark:hover:bg-zinc-700"
              aria-label="More options"
            >
              <span className="block w-5 h-5 leading-5 text-center font-bold">⋯</span>
            </button>
            {showOverflowMenu && (
              <div
                className="absolute top-12 left-0 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden min-w-[160px] py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { setShowOverflowMenu(false); setShowBlockReport('report'); }}
                  className="w-full px-3 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  🚩 Report
                </button>
                <button
                  onClick={() => { setShowOverflowMenu(false); setShowBlockReport('block'); }}
                  className="w-full px-3 py-2.5 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  🚫 Block user
                </button>
              </div>
            )}
          </div>
        )}

        {/* LEFT — photos.
            On mobile: photo sits in an inset frame whose horizontal padding
            matches the bio pane below (px-6) so the photo and content align
            on the same vertical edges. Top padding is smaller so the photo
            doesn't feel disconnected from the modal top edge. */}
        <div className="px-6 pt-3 pb-0 lg:p-0 lg:h-full flex-shrink-0">
          <div className="relative aspect-[3/4] max-h-[55vh] lg:max-h-none lg:aspect-auto lg:h-full bg-gray-100 dark:bg-zinc-800 overflow-hidden rounded-xl lg:rounded-none">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[photoIdx]}
                alt={`${candidate.name} ${photoIdx + 1}`}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx((photoIdx - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 hover:bg-white shadow-sm"
                  >
                    <IconChevronLeft />
                  </button>
                  <button
                    onClick={() => setPhotoIdx((photoIdx + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 dark:bg-zinc-800/90 text-gray-700 dark:text-gray-200 hover:bg-white shadow-sm"
                  >
                    <IconChevronRight />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === photoIdx ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300 dark:text-zinc-700">👤</div>
          )}

          {/* Like button overlay on photo (mobile/desktop both visible) */}
          {showLikeButton && (
            <div className="absolute bottom-6 right-4 z-20">
              <LikeButton
                candidate={candidate}
                size="lg"
                showSuperLike={true}
                onMatched={onMatched}
                onLimitReached={onUpgrade}
              />
            </div>
          )}
          </div>
        </div>

        {/* RIGHT — content */}
        <div className="lg:overflow-y-auto p-6">
          {/* Header */}
          <div className={`mb-4 ${showLikeButton ? 'pl-10 lg:pl-12' : ''} pr-10 lg:pr-12`}>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {candidate.name}{candidate.age ? `, ${candidate.age}` : ''}
              </h2>
              {candidate.isVerified && (
                <span className="text-blue-500" title="Verified"><IconCheck /></span>
              )}
              {candidate.isPremium && (
                <span className="text-yellow-500" title="Pro user"><IconZap /></span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{candidate.location}</p>
            {candidate.jobTitle && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {candidate.jobTitle}{candidate.work ? ` · ${candidate.work}` : ''}
              </p>
            )}
          </div>

          {/* Compatibility report */}
          {candidate.compatibilityScore > 0 && (
            <div className="mb-6">
              <CompatibilityReport
                items={candidate.compatibilityReport ?? []}
                score={candidate.compatibilityScore}
                isPro={isPro}
                onUpgrade={onUpgrade}
              />
            </div>
          )}

          {/* Bio */}
          {candidate.bio && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{candidate.bio}</p>
            </div>
          )}

          {/* Quick info */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">The Basics</h3>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
              <Field k="height" label="Height" />
              <Field k="ethnicity" label="Ethnicity" />
              <Field k="religion" label="Religion" />
              <Field k="politics" label="Politics" />
              <Field k="zodiac" label="Zodiac" />
              <Field k="languages" label="Languages" />
              <Field k="hometown" label="Hometown" />
            </div>
          </div>

          {/* Looking for */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Looking For</h3>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
              <Field k="datingIntention" label="Intent" />
              <Field k="relationshipType" label="Relationship type" />
              <Field k="marriageTimeline" label="Marriage timeline" />
              <Field k="children" label="Has children" />
              <Field k="familyPlans" label="Family plans" />
              <Field k="loveLanguage" label="Love language" />
            </div>
          </div>

          {/* Lifestyle */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lifestyle</h3>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
              <Field k="drinking" label="Drinking" />
              <Field k="smoking" label="Smoking" />
              <Field k="marijuana" label="Marijuana" />
              <Field k="drugs" label="Other drugs" />
              <Field k="gymRoutine" label="Exercise" />
              <Field k="dietaryPreferences" label="Diet" />
              <Field k="sleepSchedule" label="Sleep" />
              <Field k="livingPreference" label="Living" />
              <Field k="canCook" label="Cooking" />
            </div>
          </div>

          {/* Personality */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Personality</h3>
            <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
              <Field k="socialBattery" label="Social battery" />
              <Field k="attachmentStyle" label="Attachment" />
              <Field k="conflictResolution" label="Conflict style" />
              <Field k="financialApproach" label="Money" />
            </div>
          </div>

          {/* Interests */}
          {(candidate.hobbies || candidate.travelStyle || candidate.musicGenre || candidate.sportsInterest) && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Interests</h3>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <Field k="hobbies" label="Hobbies" />
                <Field k="travelStyle" label="Travel" />
                <Field k="musicGenre" label="Music" />
                <Field k="sportsInterest" label="Sports" />
                <Field k="readingInterest" label="Reading" />
                <Field k="nextTravelDestination" label="Next trip" />
              </div>
            </div>
          )}

          {/* Education / Career */}
          {(candidate.educationLevel || candidate.university || candidate.workStyle) && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Education & Work</h3>
              <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3">
                <Field k="educationLevel" label="Education" />
                <Field k="university" label="University" />
                <Field k="workStyle" label="Work style" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block / Report modal */}
      {showBlockReport && (
        <BlockReportModal
          mode={showBlockReport}
          targetId={candidate.id}
          targetName={candidate.name}
          onClose={() => setShowBlockReport(null)}
          onComplete={() => {
            setShowBlockReport(null);
            onClose(); // close the profile modal too once they've blocked/reported
          }}
        />
      )}
    </div>
  );
};

export default ProfileModal;
