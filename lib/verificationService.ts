// ============================================================================
// verificationService
//
// Users submit a verification request with their social media profile links.
// Admins review in the admin panel. On approval, is_verified flips to true.
// ============================================================================

import { supabase } from './supabase';

export interface VerificationRequestInput {
  linkedinUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  userNotes?: string;
}

export interface VerificationRequestRow {
  id: string;
  user_id: string;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  user_notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface PendingVerification {
  request_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_photo_urls: string[];
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  user_notes: string | null;
  requested_at: string;
}

// ----------------------------------------------------------------------------
// User submits a verification request
// ----------------------------------------------------------------------------

export async function submitVerificationRequest(
  input: VerificationRequestInput
): Promise<{ requestId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('submit_verification_request', {
    p_linkedin_url: input.linkedinUrl ?? '',
    p_instagram_url: input.instagramUrl ?? '',
    p_facebook_url: input.facebookUrl ?? '',
    p_twitter_url: input.twitterUrl ?? '',
    p_user_notes: input.userNotes ?? '',
  });

  if (error) return { requestId: null, error: error.message };
  return { requestId: data as string, error: null };
}

// ----------------------------------------------------------------------------
// Get the user's most recent verification request (any status)
// ----------------------------------------------------------------------------

export async function getMyVerificationRequest(
  userId: string
): Promise<{ request: VerificationRequestRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { request: null, error: error.message };
  return { request: data as VerificationRequestRow | null, error: null };
}

// ----------------------------------------------------------------------------
// Admin: fetch all pending verifications
// ----------------------------------------------------------------------------

export async function fetchPendingVerifications(): Promise<{
  requests: PendingVerification[];
  error: string | null;
}> {
  const { data, error } = await supabase.rpc('admin_pending_verifications');
  if (error) return { requests: [], error: error.message };
  return { requests: (data ?? []) as PendingVerification[], error: null };
}

// ----------------------------------------------------------------------------
// Admin: approve or reject a verification request
// ----------------------------------------------------------------------------

export async function reviewVerificationRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  notes: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('admin_review_verification', {
    request_id: requestId,
    decision,
    notes,
  });
  if (error) return { error: error.message };
  return { error: null };
}
