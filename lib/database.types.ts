// ============================================================================
// Supabase Database Types
// Hand-written to match supabase/001_initial_schema.sql.
// In Phase 2+ you can regenerate these with:
//   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
      };
      likes: {
        Row: LikeRow;
        Insert: Omit<LikeRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<LikeRow>;
      };
      matches: {
        Row: MatchRow;
        Insert: Omit<MatchRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<MatchRow>;
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<MessageRow>;
      };
      blocks: {
        Row: BlockRow;
        Insert: Omit<BlockRow, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<BlockRow>;
      };
      reports: {
        Row: ReportRow;
        Insert: Omit<ReportRow, 'id' | 'created_at' | 'status'> & {
          id?: string;
          created_at?: string;
          status?: ReportRow['status'];
        };
        Update: Partial<ReportRow>;
      };
    };
  };
}

// ----------------------------------------------------------------------------
// Row shapes (one per table)
// ----------------------------------------------------------------------------

export interface ProfileRow {
  id: string;

  // account meta
  email: string | null;
  phone_number: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  account_created: string;
  onboarding_complete: boolean;
  verification_status: 'unverified' | 'pending' | 'verified';
  is_verified: boolean;

  // subscription
  subscription_tier: 'FREE' | 'PRO';
  subscription_renews_at: string | null;

  // usage tracking
  daily_search_count: number;
  last_search_date: string;
  daily_like_count: number;
  last_like_date: string;
  daily_super_like_count: number;
  last_super_like_date: string;

  // basics
  name: string | null;
  age: number | null;
  age_changed_once: boolean;
  gender: string | null;
  pronouns: string | null;
  sexuality: string | null;
  interested_in: string | null;
  location: string | null;
  hometown: string | null;
  ethnicity: string | null;
  race: string | null;
  nationality_count: number | null;
  languages: string | null;

  // appearance
  height: string | null;
  body_type: string | null;
  hair_color: string | null;
  hair_type: string | null;
  eye_color: string | null;
  facial_hair: string | null;
  makeup_routine: string | null;
  clothing_style: string | null;
  wears_glasses: string | null;
  wears_lenses: string | null;
  wears_jewelry: string | null;
  body_hair: string | null;
  has_tattoos: string | null;
  dresses_well: string | null;
  hygiene: string | null;

  // lifestyle
  drinking: string | null;
  smoking: string | null;
  marijuana: string | null;
  drugs: string | null;
  covid_vaccine: string | null;
  drives_car: string | null;
  has_drivers_license: string | null;
  living_preference: string | null;
  favorite_drink: string | null;
  can_cook: string | null;
  baking_interest: string | null;
  shopping_preference: string | null;
  gym_routine: string | null;
  sports_interest: string | null;
  reading_interest: string | null;
  hobbies: string | null;
  is_organised: string | null;
  snoring: string | null;
  phone_type: string | null;

  // travel
  loves_travel: string | null;
  travel_style: string | null;
  next_travel_destination: string | null;

  // career
  job_title: string | null;
  work: string | null;
  university: string | null;
  education_level: string | null;
  work_style: string | null;

  // background
  religion: string | null;
  politics: string | null;
  zodiac: string | null;
  therapy_history: string | null;
  childhood_description: string | null;
  music_genre: string | null;
  family_health_history: string | null;
  criminal_record: string | null;

  // future
  future_plans: string | null;
  dream_house_type: string | null;

  // family & dating
  love_language: string | null;
  relationship_type: string | null;
  dating_intention: string | null;
  children: string | null;
  family_plans: string | null;
  pets: string | null;
  marriage_timeline: string | null;
  sex_style: string | null;
  interracial_marriage: string | null;
  siblings: string | null;
  family_closeness: string | null;
  financial_splitting: string | null;

  // psychology
  conflict_resolution: string | null;
  social_battery: string | null;
  dietary_preferences: string | null;
  attachment_style: string | null;
  sleep_schedule: string | null;
  financial_approach: string | null;

  // summary & socials
  description: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;

  // photos & privacy
  photo_urls: string[];
  hidden_fields: string[];

  // settings
  settings_incognito: boolean;
  settings_show_online: boolean;
  settings_read_receipts: boolean;
  settings_push_notifs: boolean;
  settings_email_notifs: boolean;

  // presence
  last_active_at: string;
  updated_at: string;
}

export interface LikeRow {
  id: string;
  liker_id: string;
  liked_id: string;
  is_super_like: boolean;
  created_at: string;
}

export interface MatchRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  unmatched_at: string | null;
  unmatched_by: string | null;
}

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'date_proposal';
  read_at: string | null;
  created_at: string;
}

export interface BlockRow {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
}

export interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: string;
}
