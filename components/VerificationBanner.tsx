import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/useToast';
import { markVerified } from '../lib/profileService';
import { IconShield } from '../constants';
import type { VerificationStatus } from '../lib/profileService';

interface VerificationBannerProps {
  verification: VerificationStatus;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ verification }) => {
  const { session, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const [verifying, setVerifying] = useState(false);

  // Phase 4 stub: one-click verification for testing.
  // Real flow (selfie + ID upload + manual review) comes in Phase 6.
  const handleVerify = async () => {
    if (!session?.user.id) return;
    setVerifying(true);
    const { error } = await markVerified(session.user.id);
    setVerifying(false);
    if (error) {
      showToast(`Couldn't verify: ${error}`, 'error');
      return;
    }
    showToast('Verified! You can now search and like.', 'success');
    await refreshProfile();
  };

  return (
    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 flex items-start gap-3">
      <div className="text-red-500 flex-shrink-0 mt-0.5"><IconShield /></div>
      <div className="flex-1">
        <h3 className="font-bold text-red-900 dark:text-red-200 mb-1">Verify your account to continue</h3>
        <p className="text-sm text-red-800 dark:text-red-300 mb-3">
          Your 72-hour grace period has ended. Verify your identity to keep searching and matching.
          {verification.hoursSinceCreation > 0 && (
            <> Account is {Math.floor(verification.hoursSinceCreation / 24)}d {verification.hoursSinceCreation % 24}h old.</>
          )}
        </p>
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {verifying ? 'Verifying…' : '✓ Verify Now (test)'}
        </button>
        <p className="text-[11px] text-red-700 dark:text-red-400 mt-2">
          Note: This is a one-click stub for Phase 4 testing. Real verification (selfie + ID) comes in Phase 6.
        </p>
      </div>
    </div>
  );
};

export default VerificationBanner;
