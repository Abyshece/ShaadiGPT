import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import {
  submitVerificationRequest, getMyVerificationRequest,
} from '../lib/verificationService';
import type { VerificationRequestRow } from '../lib/verificationService';
import { IconX, IconCheck } from '../constants';

// ============================================================================
// VerificationRequestModal
//
// Modal for users to submit (or resubmit) a verification request. They
// provide links to their social media profiles; an admin reviews and approves
// or rejects.
//
// States this component handles:
//   - First-time submission (no prior request)
//   - Already pending (show "we're reviewing")
//   - Previously rejected (show admin notes + allow resubmit)
//   - Already verified (show "you're verified!")
// ============================================================================

interface VerificationRequestModalProps {
  onClose: () => void;
  onSubmitted?: () => void;  // called after a successful submission
}

const VerificationRequestModal: React.FC<VerificationRequestModalProps> = ({
  onClose, onSubmitted,
}) => {
  const { session, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [existing, setExisting] = useState<VerificationRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill with whatever the user has on their profile
  const [linkedin, setLinkedin] = useState(profile?.linkedin ?? '');
  const [instagram, setInstagram] = useState(profile?.instagram ?? '');
  const [facebook, setFacebook] = useState(profile?.facebook ?? '');
  const [twitter, setTwitter] = useState(profile?.twitter ?? '');
  const [notes, setNotes] = useState('');

  // Load any existing request
  useEffect(() => {
    if (!session?.user.id) return;
    getMyVerificationRequest(session.user.id).then(({ request }) => {
      setExisting(request);
      // If they have a prior request, pre-fill from it
      if (request) {
        setLinkedin(request.linkedin_url ?? linkedin);
        setInstagram(request.instagram_url ?? instagram);
        setFacebook(request.facebook_url ?? facebook);
        setTwitter(request.twitter_url ?? twitter);
        setNotes(request.user_notes ?? '');
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  // Count non-empty links
  const links = [linkedin, instagram, facebook, twitter].filter((l) => l.trim().length > 0);
  const canSubmit = links.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) {
      showToast('Please provide at least 2 social media profile links', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await submitVerificationRequest({
      linkedinUrl: linkedin.trim(),
      instagramUrl: instagram.trim(),
      facebookUrl: facebook.trim(),
      twitterUrl: twitter.trim(),
      userNotes: notes.trim(),
    });
    setSubmitting(false);
    if (error) {
      showToast(`Couldn't submit: ${error}`, 'error');
      return;
    }
    showToast('Verification request submitted. We\'ll review within 24-48 hours.', 'success');
    await refreshProfile();
    if (onSubmitted) onSubmitted();
    onClose();
  };

  // Already verified — show celebration, don't allow re-submission
  if (profile?.isVerified) {
    return (
      <Wrapper onClose={onClose}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl">
            ✓
          </div>
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
      <div className="p-6">
        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-2xl">
            🪪
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {isPending ? 'Verification in review' : wasRejected ? 'Resubmit verification' : 'Get verified'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isPending
              ? 'We\'re checking your social profiles. Usually takes 24-48 hours. You can update your submission below if needed.'
              : wasRejected
                ? 'Your previous request was not approved. Please update and try again.'
                : 'Verified profiles get more matches and stand out from the rest. Share links to at least 2 of your real social media profiles so we can confirm your identity.'}
          </p>
        </div>

        {/* Rejected notes from admin */}
        {wasRejected && existing?.admin_notes && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg p-3 mb-5 text-sm text-red-800 dark:text-red-300">
            <p className="font-bold mb-1">Why it was rejected:</p>
            <p className="text-xs italic">"{existing.admin_notes}"</p>
          </div>
        )}

        {/* Form */}
        {loading ? (
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 bg-gray-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-3 mb-5">
            <SocialInput
              label="LinkedIn"
              icon="💼"
              placeholder="https://linkedin.com/in/yourname"
              value={linkedin}
              onChange={setLinkedin}
            />
            <SocialInput
              label="Instagram"
              icon="📷"
              placeholder="https://instagram.com/yourname"
              value={instagram}
              onChange={setInstagram}
            />
            <SocialInput
              label="Facebook"
              icon="👥"
              placeholder="https://facebook.com/yourname"
              value={facebook}
              onChange={setFacebook}
            />
            <SocialInput
              label="Twitter / X"
              icon="🐦"
              placeholder="https://twitter.com/yourname"
              value={twitter}
              onChange={setTwitter}
            />

            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Anything you'd like our reviewer to know"
                className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-4 flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${canSubmit ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-600'}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {links.length === 0 ? 'Add at least 2 links to submit' :
             links.length === 1 ? '1 of 2 minimum links — add 1 more' :
             `${links.length} ${links.length === 1 ? 'link' : 'links'} provided ✓`}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            {isPending ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Submitting…' :
             isPending ? 'Update submission' :
             wasRejected ? 'Resubmit' :
             'Submit for review'}
          </button>
        </div>

        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 text-center leading-relaxed">
          We only use these links to verify your identity. They aren't shared with other users unless you've added them to your profile separately.
        </p>
      </div>
    </Wrapper>
  );
};

// ----------------------------------------------------------------------------
// SocialInput sub-component
// ----------------------------------------------------------------------------

const SocialInput: React.FC<{
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, icon, placeholder, value, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">
      <span className="mr-1">{icon}</span> {label}
    </label>
    <input
      type="url"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

// ----------------------------------------------------------------------------
// Wrapper (modal scrim)
// ----------------------------------------------------------------------------

const Wrapper: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({
  onClose, children,
}) => (
  <div
    className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    onClick={onClose}
  >
    <div
      className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-zinc-800 relative max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-30 p-1.5 rounded-full text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800"
      >
        <IconX />
      </button>
      {children}
    </div>
  </div>
);

export default VerificationRequestModal;
