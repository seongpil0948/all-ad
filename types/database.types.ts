export type PlatformType =
  | "facebook"
  | "google"
  | "kakao"
  | "naver"
  | "coupang";
export type UserRole = "master" | "viewer" | "editor";

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  master_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  invited_by?: string | null;
  joined_at: string;
}

// Extended TeamMember type with profile information
export interface TeamMemberWithProfile extends TeamMember {
  profiles: Profile | null;
}

export interface PlatformCredential {
  id: string;
  team_id: string;
  platform: PlatformType;
  credentials: Record<string, any>;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

export interface Campaign {
  id: string;
  team_id: string;
  platform: PlatformType;
  platform_campaign_id: string;
  name: string;
  status?: string | null;
  budget?: number | null;
  is_active: boolean;
  raw_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  synced_at?: string | null;
}

export interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  revenue: number;
  raw_data?: Record<string, any> | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Team, "id" | "created_at">>;
      };
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, "id" | "joined_at">;
        Update: Partial<Omit<TeamMember, "id" | "joined_at">>;
      };
      platform_credentials: {
        Row: PlatformCredential;
        Insert: Omit<PlatformCredential, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PlatformCredential, "id" | "created_at">>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Campaign, "id" | "created_at">>;
      };
      campaign_metrics: {
        Row: CampaignMetric;
        Insert: Omit<CampaignMetric, "id" | "created_at">;
        Update: Partial<Omit<CampaignMetric, "id" | "created_at">>;
      };
    };
  };
}
