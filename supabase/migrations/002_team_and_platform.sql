-- =====================================================
-- 002_team_and_platform.sql
-- 팀 관리, 플랫폼 인증, 캠페인 관련 테이블
-- =====================================================

-- =====================================================
-- 팀 관련 테이블
-- =====================================================

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  master_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status invitation_status DEFAULT 'pending' NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days') NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_role CHECK (role IN ('team_mate', 'viewer'))
);

-- =====================================================
-- 플랫폼 및 캠페인 관련 테이블
-- =====================================================

-- Create platform credentials table
CREATE TABLE IF NOT EXISTS public.platform_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  platform platform_type NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT,
  credentials JSONB NOT NULL DEFAULT '{}',
  data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, platform, account_id)
);

-- Create campaigns table with foreign key to platform_credentials
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  platform platform_type NOT NULL,
  platform_campaign_id TEXT NOT NULL,
  platform_credential_id UUID REFERENCES public.platform_credentials(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT,
  budget DECIMAL(15, 2),
  is_active BOOLEAN DEFAULT true,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(team_id, platform, platform_campaign_id)
);

-- Create campaign metrics table
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  cost DECIMAL(15, 2) DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(campaign_id, date)
);

-- =====================================================
-- 인덱스 생성
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_team_platform ON public.campaigns(team_id, platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_platform_credential ON public.campaigns(platform_credential_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_date ON public.campaign_metrics(campaign_id, date);
CREATE INDEX IF NOT EXISTS idx_platform_credentials_team ON public.platform_credentials(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);

-- =====================================================
-- 기본 RLS 활성화
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;