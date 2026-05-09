import React from 'react';
import { useAuth } from '../../lib/AuthContext';
import StepBasicInfo from './StepBasicInfo';
import StepPhotos from './StepPhotos';
import StepProfileDetails from './StepProfileDetails';

// ============================================================================
// OnboardingShell
//
// Decides which onboarding step to show based on what's already in the
// user's profile row. This way, if the user closes the tab and comes back,
// they resume at the right step without us having to track step state.
//
// Step rules:
//   - if `name` is empty → StepBasicInfo
//   - else if `photo_urls` has fewer than 4 → StepPhotos
//   - else → StepProfileDetails
//
// `onboarding_complete` flips to true at the end of StepProfileDetails.
// At that point, App.tsx renders the Dashboard instead.
// ============================================================================

interface OnboardingShellProps {
  onComplete: () => void;
}

type Step = 'BASIC' | 'PHOTOS' | 'DETAILS';

const OnboardingShell: React.FC<OnboardingShellProps> = ({ onComplete }) => {
  const { profileRow, refreshProfile } = useAuth();
  // Local override lets us advance immediately on save instead of waiting for
  // the auth context to refresh. We still call refreshProfile() so the
  // database is the source of truth — local state just bridges the gap.
  const [forcedStep, setForcedStep] = React.useState<Step | null>(null);

  if (!profileRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#191919]">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const derivedStep: Step = (() => {
    if (!profileRow.name) return 'BASIC';
    if ((profileRow.photo_urls?.length ?? 0) < 4) return 'PHOTOS';
    return 'DETAILS';
  })();

  const step: Step = forcedStep ?? derivedStep;

  if (step === 'BASIC') {
    return (
      <StepBasicInfo
        onComplete={async () => {
          await refreshProfile();
          setForcedStep('PHOTOS');
        }}
      />
    );
  }

  if (step === 'PHOTOS') {
    return (
      <StepPhotos
        onComplete={async () => {
          await refreshProfile();
          setForcedStep('DETAILS');
        }}
        onBack={() => setForcedStep('BASIC')}
      />
    );
  }

  return (
    <StepProfileDetails
      onComplete={async () => {
        await refreshProfile();
        onComplete();
      }}
      onBack={() => setForcedStep('PHOTOS')}
    />
  );
};

export default OnboardingShell;
