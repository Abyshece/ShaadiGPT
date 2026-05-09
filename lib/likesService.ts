// ============================================================================
// likesService
//
// Wraps the `likes` table. Insertion fires the `check_for_match` trigger on
// the DB which auto-creates a `matches` row when the like is mutual. The
// frontend listens for that match via Realtime in chatService.
// ============================================================================

import { supabase } from './supabase';
import type { MatchCandidate } from '../types';

export interface LikeReceived {
  likeId: string;
  likerId: string;
  isSuperLike: boolean;
  likedAt: string;
  liker: {
    id: string;
    name: string;
    age: number | null;
    location: string;
    photos: string[];
    subscriptionTier: 'FREE' | 'PRO';
    isVerified: boolean;
    hiddenFields: string[];
    description: string;
  };
}

export interface LikeResult {
  success: boolean;
  matched: boolean;          // true if a match was created (mutual like)
  matchId?: string;
  error?: string;
}

// ----------------------------------------------------------------------------
// likeUser — insert into likes, check if it caused a match
// ----------------------------------------------------------------------------

export async function likeUser(
  likerId: string,
  likedId: string,
  isSuperLike = false
): Promise<LikeResult> {
  // Insert the like row. Trigger auto-creates a match if mutual.
  const { error: insertError } = await supabase
    .from('likes')
    .insert({
      liker_id: likerId,
      liked_id: likedId,
      is_super_like: isSuperLike,
    });

  if (insertError) {
    // unique violation = already liked
    if (insertError.code === '23505') {
      return { success: false, matched: false, error: 'Already liked this user' };
    }
    return { success: false, matched: false, error: insertError.message };
  }

  // Check if a match row exists now (the trigger inserts one when mutual)
  const userA = likerId < likedId ? likerId : likedId;
  const userB = likerId < likedId ? likedId : likerId;

  const { data: matchData } = await supabase
    .from('matches')
    .select('id')
    .eq('user_a_id', userA)
    .eq('user_b_id', userB)
    .is('unmatched_at', null)
    .maybeSingle();

  if (matchData) {
    return { success: true, matched: true, matchId: matchData.id };
  }
  return { success: true, matched: false };
}

// ----------------------------------------------------------------------------
// unlikeUser — remove a previous like (e.g. user wants to undo)
// ----------------------------------------------------------------------------

export async function unlikeUser(
  likerId: string,
  likedId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('liker_id', likerId)
    .eq('liked_id', likedId);
  if (error) return { error: error.message };
  return { error: null };
}

// ----------------------------------------------------------------------------
// hasLiked — check whether current user has already liked someone
// ----------------------------------------------------------------------------

export async function hasLiked(
  likerId: string,
  likedId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('liker_id', likerId)
    .eq('liked_id', likedId)
    .maybeSingle();
  return !!data;
}

// ----------------------------------------------------------------------------
// listLikesSent — IDs of everyone the current user has liked
// (Used by the search results to badge "liked" on cards)
// ----------------------------------------------------------------------------

export async function listLikesSent(likerId: string): Promise<{ likedIds: Set<string>; error: string | null }> {
  const { data, error } = await supabase
    .from('likes')
    .select('liked_id')
    .eq('liker_id', likerId);
  if (error) return { likedIds: new Set(), error: error.message };
  return { likedIds: new Set((data ?? []).map((r) => r.liked_id as string)), error: null };
}

// ----------------------------------------------------------------------------
// listLikesReceived — full inbox of incoming likes via RPC
// ----------------------------------------------------------------------------

export async function listLikesReceived(userId: string): Promise<{ likes: LikeReceived[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_likes_received', { p_user_id: userId });
  if (error) return { likes: [], error: error.message };

  const likes: LikeReceived[] = (data ?? []).map((row: Record<string, unknown>) => ({
    likeId: row.like_id as string,
    likerId: row.liker_id as string,
    isSuperLike: row.is_super_like as boolean,
    likedAt: row.liked_at as string,
    liker: {
      id: row.liker_id as string,
      name: (row.liker_name as string) ?? '',
      age: (row.liker_age as number) ?? null,
      location: (row.liker_location as string) ?? '',
      photos: (row.liker_photos as string[]) ?? [],
      subscriptionTier: ((row.liker_subscription_tier as string) ?? 'FREE') as 'FREE' | 'PRO',
      isVerified: (row.liker_is_verified as boolean) ?? false,
      hiddenFields: (row.liker_hidden_fields as string[]) ?? [],
      description: (row.liker_description as string) ?? '',
    },
  }));

  return { likes, error: null };
}

// ----------------------------------------------------------------------------
// Helper: convert a LikeReceived to a MatchCandidate so we can reuse
// MatchCard / ProfileModal components for the "Likes You" tab.
// (We don't have full profile data on the inbox, just a subset.)
// ----------------------------------------------------------------------------

export function likeReceivedToCandidate(like: LikeReceived): MatchCandidate {
  return {
    id: like.liker.id,
    name: like.liker.name,
    age: like.liker.age ?? 0,
    location: like.liker.location,
    compatibilityScore: 0, // unknown from this view; ProfileModal won't show report
    tags: like.isSuperLike ? ['Super Liked you ⭐'] : ['Liked you ❤️'],
    bio: like.liker.description,
    imageUrls: like.liker.photos,
    isVerified: like.liker.isVerified,
    isPremium: like.liker.subscriptionTier === 'PRO',
    subscriptionTier: like.liker.subscriptionTier,
    hiddenFields: like.liker.hiddenFields,
  };
}
