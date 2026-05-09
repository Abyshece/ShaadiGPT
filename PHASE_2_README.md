# Phase 2: Auth + 5-step Signup Flow

By the end of this phase you can: sign up with a real email, get a real OTP, verify it, fill out a real profile, and end up on a placeholder Dashboard — all backed by Supabase.

## What you're getting

| File | Where it goes | What it does |
|---|---|---|
| `lib/AuthContext.tsx` | New | Wraps the app. Exposes `useAuth()` for session + profile. |
| `lib/profileMapping.ts` | New | Converts between camelCase UI types and snake_case DB types. |
| `components/Auth.tsx` | **Replaces** old `components/Auth.tsx` | Real Supabase email/password + Google auth. |
| `components/EmailVerification.tsx` | New (replaces old `PhoneVerification.tsx`) | 6-digit OTP entry. |
| `components/onboarding/OnboardingShell.tsx` | New | Picks the right onboarding step based on profile state. |
| `components/onboarding/StepBasicInfo.tsx` | New | Step 1: name, age, gender, location, etc. |
| `components/onboarding/StepPhotos.tsx` | New | Step 2: photo upload to Supabase Storage. |
| `components/onboarding/StepProfileDetails.tsx` | New | Step 3: 5-page details form (replaces voice onboarding). |
| `components/DashboardStub.tsx` | New | Placeholder dashboard for this phase. |
| `App.tsx` | **Replaces** old `App.tsx` | Slim auth-driven router. |

## Files to DELETE

These are no longer used:

```
components/VoiceOnboarding.tsx
components/PhoneVerification.tsx
services/geminiService.ts
```

You can also delete the import of `extractProfileFromAudio` anywhere it's referenced (the only file that imported it was VoiceOnboarding.tsx itself, so deleting that file is sufficient).

## Files NOT touched in this phase

Every other component (Dashboard, Sidebar, ChatSystem, MatchCard, FilterModal, etc.) is untouched. They still use the old prop-driven flow with mock data. We'll rewire them in Phase 3+.

## Setup steps

### 1. Drop the new files in

Copy the files from this phase into your project at the paths shown in the table above. The folder `components/onboarding/` is new — create it.

### 2. Delete the obsolete files

```bash
rm components/VoiceOnboarding.tsx
rm components/PhoneVerification.tsx
rm services/geminiService.ts
```

If you want to keep `services/` around for Phase 4 (the matching service), that's fine — just delete `geminiService.ts`.

### 3. Verify Supabase email template

You already changed the "Confirm signup" template to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. Double-check by going to **Authentication → Email Templates → Confirm signup** in Supabase. The body should contain `{{ .Token }}` somewhere.

### 4. Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## What you should see + try

1. **Lands on the auth screen** — same look as before but with new copy ("Create Account" instead of "Create Profile").
2. **Click "Create Account"** — fill in a real email you can access (your own works) and a password 8+ chars. Hit Create Account. You should get redirected to the OTP screen.
3. **Check your email** — you should receive a 6-digit code from Supabase. Spam folder if not.
4. **Enter the 6-digit code** — should land on Step 1: "Tell us about yourself".
5. **Fill in basic info** → click Continue → Step 2: photo upload.
6. **Upload at least 4 photos** — they upload to Supabase Storage in real time. You can see the progress spinner per slot. Click Continue → Step 3.
7. **Click through the 5 detail pages** — fill in whatever you want, skip anything. Hit Finish on the last page.
8. **Land on the DashboardStub** — shows your name, profile data, and uploaded photos.

To verify the database side: in Supabase **Table Editor → profiles**, find the row matching your email. You should see all the fields populated.

To test "resume signup" behavior: fill in basic info, click Continue, then close the tab. Reopen the app — you should land directly on the photos step, not at auth or basic info. This works because the routing is derived from the profile row state.

## Sign-in flow (existing user)

If you sign out from the stub dashboard and sign in again with the same email + password:
- AuthContext picks up the session → loads the profile row → sees `onboarding_complete = true` → routes you straight to the dashboard. No OTP needed.

## Google OAuth

Untested if you haven't set up the Google provider. If you have:
- "Continue with Google" → redirects to Google → comes back authenticated
- The trigger creates a profile row for them
- They land in onboarding (no OTP since Google already verified the email)

If you want to skip Google for now, that's fine — the button just won't work, no harm done. You can wire it up later with no code changes; it's already there.

## A few things to flag

**Forgot password.** I implemented the "send reset link" call but not the actual reset-password landing page. That's fine for now — the email gets sent and shows up in the user's inbox; clicking it would take them to a Supabase-hosted reset page. We can add a custom one later if you want.

**The DashboardStub is intentionally ugly.** It exists so you can verify everything is working end-to-end. Phase 3 brings the real Profile screen + Dashboard back online.

**Existing auth code in `App.tsx` is gone.** The old App.tsx had `MOCK_USER_PROFILE`, `MOCK_USER_PHOTOS`, `GUEST_USER_PROFILE`, manual step routing, the auth modal trigger pattern, the admin login flow, and the 72h verification lockout check. All of that is now driven by Supabase auth state. The lockout will return in Phase 3 along with the rest of the dashboard.

**TypeScript may complain about `UserProfile` type fields that aren't in `profileMapping.ts`.** That's expected — `UserProfile` from `types.ts` has a few legacy fields (e.g. `voiceIntroUrl`, `boostsClaimed`, things from features we removed). The mapping helpers safely ignore those. You'll see them disappear from `types.ts` in Phase 3 when we clean up.

## Common issues

**"Token has expired or is invalid"** when verifying OTP → the code in your inbox is more than 1 hour old, or you typed it wrong. Click "Resend" and use the new one.

**Email never arrives** → check spam. If still nothing, in Supabase go to **Authentication → Logs** and look for the most recent signup event — the response will tell you why. Most commonly: the email service rate limit (Supabase free tier limits emails per hour).

**"Photo must be under 8MB"** → reduce the file size or pick a different photo.

**Stuck loading after signing in** → open dev tools → Console. AuthContext logs a warning if it can't load your profile. If you see "failed to load profile: row not found", the trigger didn't fire. Re-run the SQL migration. (You shouldn't see this with the seeded users.)

**RLS error inserting/updating profiles** → you're trying to update a row whose `id` doesn't match `auth.uid()`. The code only does this with the current user's id, so this would only happen if Supabase's anon key is misconfigured. Check `.env.local`.

## When you're done

You should have:
- ✅ A real account in your Supabase `profiles` table created by going through the flow yourself
- ✅ Photos visible in `Storage → photos → <your-user-id>/`
- ✅ The 5-step signup flow runs end-to-end
- ✅ Sign out + sign in works
- ✅ Closing the tab mid-onboarding and resuming works

Tell me when it's working (or if anything errors) and we'll move to **Phase 3: Profile system**, where we wire up the real Dashboard, ProfileView, and SettingsView to read/write Supabase, and bring back things like profile editing, photo management from the dashboard, and the verification lockout.
