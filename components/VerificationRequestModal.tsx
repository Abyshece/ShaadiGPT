import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import {
  submitVerificationRequest, getMyVerificationRequest,
} from '../lib/verificationService';
import type { VerificationRequestRow } from '../lib/verificationService';
import { IconX, IconCheck, IconShield } from '../constants';

// ============================================================================
// VerificationRequestModal — restyled to match the legacy MatchGPT
// SocialVerificationModal design. Backend logic unchanged: real submission to
// Supabase verification_requests table for admin review.
//
// Visual layout:
//   - Header: shield icon + "Verify Identity" + subtitle
//   - 4 platform rows (LinkedIn, Instagram, Facebook required; X optional)
//     - Each row: icon, label, input, "Link" button
//     - Clicking "Link" locks that row visually (saves the URL into local state)
//     - Once linked, row shows green check + LINKED badge
//   - Footer: explainer + Cancel + Submit (only enabled when 3 required linked)
// ============================================================================

interface VerificationRequestModalProps {
  onClose: () => void;
  onSubmitted?: () => void;
}

type Platform = 'linkedin' | 'instagram' | 'facebook' | 'twitter';

const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  onClose, onSubmitted,
}) => {
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [existing, setExisting] = useState<VerificationRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linking, setLinking] = useState<Platform | null>(null);

  const [urls, setUrls] = useState<Record<Platform, string>>({
    linkedin: profile?.linkedin ?? '',
    instagram: profile?.instagram ?? '',
    facebook: profile?.facebook ?? '',
    twitter: profile?.twitter ?? '',
  });
  const [linked, setLinked] = useState<Set<Platform>>(new Set());

  useEffect(() => {
    if (!session?.user.id) return;
    getMyVerificationRequest(session.user.id).then(({ request }) => {
      setExisting(request);
      if (request) {
        const next = { ...urls };
        const autoLinked = new Set<Platform>();
        if (request.linkedin_url) { next.linkedin = request.linkedin_url; autoLinked.add('linkedin'); }
        if (request.instagram_url) { next.instagram = request.instagram_url; autoLinked.add('instagram'); }
        if (request.facebook_url) { next.facebook = request.facebook_url; autoLinked.add('facebook'); }
        if (request.twitter_url) { next.twitter = request.twitter_url; autoLinked.add('twitter'); }
        setUrls(next);
        setLinked(autoLinked);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const handleLink = (platform: Platform) => {
    const url = urls[platform].trim();
    if (url.length < 5) return;
    setLinking(platform);
    // Local UX delay to match legacy feel
    setTimeout(() => {
      setLinking(null);
      setLinked((prev) => new Set(prev).add(platform));
    }, 600);
  };

  const handleUnlink = (platform: Platform) => {
    setLinked((prev) => {
      const next = new Set(prev);
      next.delete(platform);
      return next;
    });
  };

  const canSubmit = linked.has('linkedin') && linked.has('instagram') && linked.has('facebook');

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast('Please link all 3 required accounts', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await submitVerificationRequest({
      linkedinUrl: urls.linkedin.trim(),
      instagramUrl: urls.instagram.trim(),
      facebookUrl: urls.facebook.trim(),
      twitterUrl: urls.twitter.trim(),
      userNotes: '',
    });
    setSubmitting(false);
    if (error) {
      showToast(`Couldn't submit: ${error}`, 'error');
      return;
    }
    showToast('Verification submitted. We\'ll review within 24-72 hours.', 'success');
    await refreshProfile();
    if (onSubmitted) onSubmitted();
    onClose();
  };

  // Already verified state
  if (profile?.isVerified) {
    return (
      <Wrapper onClose={onClose}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl">✓</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You're verified!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your profile shows a verified badge to other users.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold"
          >
            Close
          </button>
        </div>
      </Wrapper>
    );
  }

  const isPending = existing?.status === 'pending';
  const wasRejected = existing?.status === 'rejected';

  return (
    <Wrapper onClose={onClose}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-start bg-white dark:bg-zinc-900 relative z-10">
        <div className="flex gap-4 min-w-0">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
            <IconShield />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {isPending ? 'Verification in Review' : wasRejected ? 'Resubmit Verification' : 'Verify Identity'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">
              {isPending
                ? <>Your submission is being reviewed. Usually takes 24-72 hours.</>
                : wasRejected
                  ? <>Your previous request was rejected. Update and resubmit below.</>
                  : <>To ensure authenticity, you must link your <strong>LinkedIn, Instagram, and Facebook</strong> accounts.</>}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1 flex-shrink-0 ml-2"
          aria-label="Close"
        >
          <IconX />
        </button>
      </div>

      {/* Rejected notes */}
      {wasRejected && existing?.admin_notes && (
        <div className="mx-6 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3 text-sm text-red-800 dark:text-red-300">
          <p className="font-bold mb-1">Why it was rejected:</p>
          <p className="text-xs italic">"{existing.admin_notes}"</p>
        </div>
      )}

      {/* Platform rows */}
      <div className="flex-1 overflow-y-auto p-6 space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <SocialRow
              label="LinkedIn"
              emoji="💼"
              placeholder="https://linkedin.com/in/username"
              required
              value={urls.linkedin}
              onChange={(v) => setUrls((prev) => ({ ...prev, linkedin: v }))}
              isLinked={linked.has('linkedin')}
              isLinking={linking === 'linkedin'}
              onLink={() => handleLink('linkedin')}
              onUnlink={() => handleUnlink('linkedin')}
              disabled={isPending}
            />
            <SocialRow
              label="Instagram"
              emoji="📷"
              placeholder="https://instagram.com/username"
              required
              value={urls.instagram}
              onChange={(v) => setUrls((prev) => ({ ...prev, instagram: v }))}
              isLinked={linked.has('instagram')}
              isLinking={linking === 'instagram'}
              onLink={() => handleLink('instagram')}
              onUnlink={() => handleUnlink('instagram')}
              disabled={isPending}
            />
            <SocialRow
              label="Facebook"
              emoji="👥"
              placeholder="https://facebook.com/username"
              required
              value={urls.facebook}
              onChange={(v) => setUrls((prev) => ({ ...prev, facebook: v }))}
              isLinked={linked.has('facebook')}
              isLinking={linking === 'facebook'}
              onLink={() => handleLink('facebook')}
              onUnlink={() => handleUnlink('facebook')}
              disabled={isPending}
            />
            <SocialRow
              label="X (Twitter)"
              emoji="🐦"
              placeholder="https://x.com/username"
              value={urls.twitter}
              onChange={(v) => setUrls((prev) => ({ ...prev, twitter: v }))}
              isLinked={linked.has('twitter')}
              isLinking={linking === 'twitter'}
              onLink={() => handleLink('twitter')}
              onUnlink={() => handleUnlink('twitter')}
              disabled={isPending}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <p className="text-[10px] text-gray-400 font-medium leading-tight flex-1 min-w-[140px]">
            Verification takes 24-72 hours. Your links are secure and only used for identity checks.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            >
              {isPending ? 'Close' : 'Cancel'}
            </button>
            {!isPending && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={`px-5 py-2 rounded-md text-sm font-bold shadow-md transition-all ${
                  canSubmit && !submitting
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting…' : 'Submit for Verification'}
              </button>
            )}
          </div>
        </div>
        {!isPending && !canSubmit && (
          <p className="text-[10px] text-red-500 text-right font-bold">
            * Please link all 3 required accounts to proceed.
          </p>
        )}
      </div>
    </Wrapper>
  );
};

// ----------------------------------------------------------------------------
// SocialRow
// ----------------------------------------------------------------------------

interface SocialRowProps {
  label: string;
  emoji: string;
  placeholder: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  isLinked: boolean;
  isLinking: boolean;
  onLink: () => void;
  onUnlink: () => void;
  disabled?: boolean;
}

const SocialRow: React.FC<SocialRowProps> = ({
  label, emoji, placeholder, required,
  value, onChange, isLinked, isLinking, onLink, onUnlink, disabled,
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all group">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0 ${
      isLinked
        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
        : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
    }`}>
      {isLinked ? <IconCheck /> : <span>{emoji}</span>}
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {isLinked && (
          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 rounded font-bold">
            LINKED
          </span>
        )}
      </div>
      {isLinked ? (
        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
          🔒 {value}
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 focus:outline-none disabled:opacity-50"
        />
      )}
    </div>

    {isLinked ? (
      <button
        onClick={onUnlink}
        disabled={disabled}
        className="px-3 py-1.5 rounded-md text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex-shrink-0 disabled:opacity-50"
      >
        Edit
      </button>
    ) : (
      <button
        onClick={onLink}
        disabled={isLinking || !value || disabled}
        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex-shrink-0 ${
          value && !disabled
            ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-80 shadow-sm'
            : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLinking ? 'Checking…' : 'Link'}
      </button>
    )}
  </div>
);

// ----------------------------------------------------------------------------
// Wrapper
// ----------------------------------------------------------------------------

const Wrapper: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose, children,
}) => (
  <div
    className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-white/60 dark:bg-black/60 backdrop-blur-[12px] animate-fade-in"
    onClick={onClose}
  >
    <div
      className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

export default VerificationRequestModal;
