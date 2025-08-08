-- =====================================================
-- UNIFIED SCHEMA - Complete Optimized Version
-- Generated on: 2025-02-08
-- Description: 완전한 통합 스키마 - RLS 성능 최적화 및 로컬 환경 지원
-- =====================================================

-- =====================================================
-- TYPE DEFINITIONS
-- =====================================================

-- 플랫폼 타입 enum (Amazon, TikTok 포함)
CREATE TYPE platform_type AS ENUM ('facebook', 'google', 'kakao', 'naver', 'coupang', 'amazon', 'tiktok');

-- 사용자 역할 enum
CREATE TYPE user_role AS ENUM ('master', 'team_mate', 'viewer');

-- 초대 상태 enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- 프로필 테이블
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 팀 테이블
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  master_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 팀 멤버 테이블
CREATE TABLE public.team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 팀 초대 테이블
CREATE TABLE public.team_invitations (
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

-- 플랫폼 자격증명 테이블 (OAuth 토큰 컬럼 포함)
CREATE TABLE public.platform_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  platform platform_type NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT,
  credentials JSONB NOT NULL DEFAULT '{}',
  data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- OAuth 토큰 컬럼
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  -- Error message column
  error_message TEXT,
  UNIQUE(team_id, platform, account_id),
  CONSTRAINT check_oauth_tokens CHECK (
    CASE 
      WHEN platform IN ('google', 'facebook', 'kakao') AND is_active = true 
      THEN access_token IS NOT NULL AND refresh_token IS NOT NULL
      ELSE true
    END
  )
);

-- 캠페인 테이블
CREATE TABLE public.campaigns (
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

-- 캠페인 메트릭 테이블
CREATE TABLE public.campaign_metrics (
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

-- 동기화 로그 테이블
CREATE TABLE public.sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  sync_type TEXT CHECK (sync_type IN ('FULL', 'INCREMENTAL')) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 수동 캠페인 테이블 (API 없는 플랫폼용)
CREATE TABLE public.manual_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('coupang')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'ended')),
  budget DECIMAL(15, 2),
  spent DECIMAL(15, 2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, platform, external_id)
);

-- 수동 캠페인 메트릭 테이블
CREATE TABLE public.manual_campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_campaign_id UUID NOT NULL REFERENCES public.manual_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spent DECIMAL(15, 2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(manual_campaign_id, date)
);

-- OAuth 상태 테이블 (CSRF 보호용)
CREATE TABLE public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES (성능 최적화를 위한 추가 인덱스 포함)
-- =====================================================

-- 팀 및 멤버 인덱스
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_invitations_status ON public.team_invitations(status) WHERE status = 'pending';
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);

-- 플랫폼 및 캠페인 인덱스
CREATE INDEX idx_campaigns_team_platform ON public.campaigns(team_id, platform);
CREATE INDEX idx_campaigns_platform_credential ON public.campaigns(platform_credential_id);
CREATE INDEX idx_campaign_metrics_campaign_date ON public.campaign_metrics(campaign_id, date);
CREATE INDEX idx_platform_credentials_team ON public.platform_credentials(team_id);
CREATE INDEX idx_platform_credentials_expires_at ON public.platform_credentials(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_platform_credentials_token_refresh ON public.platform_credentials(platform, is_active, expires_at) 
  WHERE expires_at IS NOT NULL AND is_active = true;

-- 동기화 로그 인덱스
CREATE INDEX idx_sync_logs_team_platform ON public.sync_logs(team_id, platform);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- 수동 캠페인 인덱스
CREATE INDEX idx_manual_campaigns_team_id ON public.manual_campaigns(team_id);
CREATE INDEX idx_manual_campaigns_platform ON public.manual_campaigns(platform);
CREATE INDEX idx_manual_campaigns_status ON public.manual_campaigns(status);
CREATE INDEX idx_manual_campaign_metrics_campaign_id ON public.manual_campaign_metrics(manual_campaign_id);
CREATE INDEX idx_manual_campaign_metrics_date ON public.manual_campaign_metrics(date);

-- OAuth 상태 인덱스
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);
CREATE INDEX idx_oauth_states_created_at ON public.oauth_states(created_at);

-- RLS 성능 최적화를 위한 추가 인덱스
CREATE INDEX idx_teams_master_user_id ON public.teams(master_user_id);
CREATE INDEX idx_platform_credentials_created_by ON public.platform_credentials(created_by);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- 새 사용자 생성 처리 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- 프로필 생성
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- 사용자를 위한 기본 팀 생성
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(new.email, 'My Team'), new.id)
  RETURNING id INTO new_team_id;
  
  RETURN new;
END;
$$;

-- 사용자를 위한 팀 생성 함수
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_team_id UUID;
  user_email TEXT;
BEGIN
  -- 사용자 이메일 가져오기
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- 팀 생성
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_email, 'My Team'), user_id)
  RETURNING id INTO new_team_id;
  
  RETURN new_team_id;
END;
$$;

-- 팀 초대 수락 함수
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- 현재 사용자 가져오기
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- 초대 찾기
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- 이미 멤버인지 확인
  IF EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = v_invitation.team_id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this team');
  END IF;
  
  -- 팀에 사용자 추가
  INSERT INTO public.team_members (team_id, user_id, role, invited_by)
  VALUES (v_invitation.team_id, v_user_id, v_invitation.role, v_invitation.invited_by);
  
  -- 초대 상태 업데이트
  UPDATE public.team_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_invitation.id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'team_id', v_invitation.team_id,
    'role', v_invitation.role
  );
END;
$$;

-- 팀 멤버 제한 확인 함수
CREATE OR REPLACE FUNCTION public.check_team_member_limit(team_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_count INTEGER;
  team_limit INTEGER := 5; -- V1.0 기본 제한
BEGIN
  -- 마스터 포함 기존 멤버 수 계산
  SELECT COUNT(*) INTO member_count
  FROM (
    SELECT user_id FROM public.team_members WHERE team_id = team_id_param
    UNION
    SELECT master_user_id FROM public.teams WHERE id = team_id_param
  ) AS all_members;
  
  RETURN member_count < team_limit;
END;
$$;

-- 토큰으로 초대 가져오기 (공개 접근)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invitation_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT 
    i.id,
    i.team_id,
    t.name as team_name,
    i.email,
    i.role,
    u.email as invited_by_email,
    i.status,
    i.expires_at
  INTO v_invitation
  FROM public.team_invitations i
  JOIN public.teams t ON i.team_id = t.id
  JOIN auth.users u ON i.invited_by = u.id
  WHERE i.token = invitation_token;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  RETURN jsonb_build_object(
    'id', v_invitation.id,
    'team_id', v_invitation.team_id,
    'team_name', v_invitation.team_name,
    'email', v_invitation.email,
    'role', v_invitation.role,
    'invited_by_email', v_invitation.invited_by_email,
    'status', v_invitation.status,
    'expires_at', v_invitation.expires_at
  );
END;
$$;

-- 업데이트 타임스탬프 트리거 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 사용자 팀 가져오기 (RLS 정책용 헬퍼)
CREATE OR REPLACE FUNCTION public.user_teams(user_id UUID)
RETURNS TABLE(team_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id AS team_id
  FROM public.teams t
  WHERE t.master_user_id = $1
  UNION
  SELECT tm.team_id AS team_id
  FROM public.team_members tm
  WHERE tm.user_id = $1;
END;
$$;

-- 사용자가 팀을 가지도록 보장하는 함수 (UUID 매개변수 버전)
CREATE OR REPLACE FUNCTION public.ensure_user_has_team(user_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  existing_team_id UUID;
  new_team_id UUID;
  user_email TEXT;
BEGIN
  -- 이미 팀이 있는지 확인 (마스터로서)
  SELECT t.id INTO existing_team_id
  FROM public.teams t
  WHERE t.master_user_id = user_id_param
  LIMIT 1;
  
  IF existing_team_id IS NOT NULL THEN
    RETURN existing_team_id;
  END IF;
  
  -- 팀 멤버인지 확인
  SELECT tm.team_id INTO existing_team_id
  FROM public.team_members tm
  WHERE tm.user_id = user_id_param
  LIMIT 1;
  
  IF existing_team_id IS NOT NULL THEN
    RETURN existing_team_id;
  END IF;
  
  -- 팀이 없으면 생성
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_email, 'My Team'), user_id_param)
  RETURNING id INTO new_team_id;
  
  RETURN new_team_id;
END;
$$;

-- 사용자가 팀을 가지도록 보장하는 함수 (매개변수 없는 버전, 현재 인증된 사용자용)
CREATE OR REPLACE FUNCTION public.ensure_user_has_team()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    team_count int;
    new_team_id uuid;
    current_user_id uuid;
BEGIN
    -- 현재 사용자 ID 가져오기
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- 현재 사용자의 팀 수 확인
    SELECT COUNT(*) INTO team_count
    FROM (
        SELECT t.id FROM public.teams t WHERE t.master_user_id = current_user_id
        UNION
        SELECT tm.team_id FROM public.team_members tm WHERE tm.user_id = current_user_id
    ) AS user_teams;
    
    -- 팀이 없으면 생성
    IF team_count = 0 THEN
        new_team_id := public.create_team_for_user(current_user_id);
    END IF;
END;
$$;

-- 수동 캠페인 타임스탬프 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_manual_campaign_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, auth
AS $$
BEGIN
  NEW.last_updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

-- 오래된 OAuth 상태 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_old_oauth_states()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$;

-- 크론 작업 상태 가져오기 함수 (로컬 환경용 - 단순화된 버전)
CREATE OR REPLACE FUNCTION public.get_cron_job_status()
RETURNS TABLE(
  jobname text,
  status text,
  message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 로컬 환경에서는 단순화된 상태 반환
  RETURN QUERY
  SELECT 
    'refresh-oauth-tokens'::text as jobname,
    'simulated'::text as status,
    'Local environment - cron jobs are simulated'::text as message
  UNION ALL
  SELECT 
    'google-ads-sync-hourly'::text as jobname,
    'simulated'::text as status,
    'Local environment - cron jobs are simulated'::text as message;
END;
$$;

-- Edge Function 호출 함수 (로컬 환경용 - 단순화된 버전)
CREATE OR REPLACE FUNCTION public.call_edge_function(function_name text, payload jsonb DEFAULT '{}')
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 로컬 환경에서는 단순히 로그만 남기고 더미 ID 반환
  RAISE NOTICE 'Local environment: Edge function % called with payload %', function_name, payload;
  RETURN 1;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 새 사용자 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 업데이트 타임스탬프 트리거
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_credentials_updated_at BEFORE UPDATE ON public.platform_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manual_campaigns_updated_at
  BEFORE UPDATE ON public.manual_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_campaign_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - 성능 최적화 적용
-- =====================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Profiles 정책 (성능 최적화 적용)
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT 
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE 
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- Teams 정책 (성능 최적화 적용)
CREATE POLICY "Users can view teams they belong to" ON public.teams
  FOR SELECT 
  TO authenticated
  USING (
    id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Users can create their own teams" ON public.teams
  FOR INSERT 
  TO authenticated
  WITH CHECK (master_user_id = (SELECT auth.uid()));

CREATE POLICY "Masters can update their teams" ON public.teams
  FOR UPDATE 
  TO authenticated
  USING (master_user_id = (SELECT auth.uid()));

CREATE POLICY "Masters can delete their teams" ON public.teams
  FOR DELETE 
  TO authenticated
  USING (master_user_id = (SELECT auth.uid()));

-- Team members 정책 (성능 최적화 적용)
CREATE POLICY "Users can view their team memberships" ON public.team_members
  FOR SELECT 
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Masters can manage team members" ON public.team_members
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Masters can update team members" ON public.team_members
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Masters can remove team members" ON public.team_members
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id
      AND t.master_user_id = (SELECT auth.uid())
    )
  );

-- Team invitations 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view invitations" ON public.team_invitations
  FOR SELECT 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can create invitations" ON public.team_invitations
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    AND team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Masters can update invitations" ON public.team_invitations
  FOR UPDATE 
  TO authenticated
  USING (
    team_id IN (SELECT t.id FROM public.teams t WHERE t.master_user_id = (SELECT auth.uid()))
  );

-- Platform credentials 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view credentials" ON public.platform_credentials
  FOR SELECT 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can create credentials" ON public.platform_credentials
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY "Team members can update credentials" ON public.platform_credentials
  FOR UPDATE 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  )
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can delete credentials" ON public.platform_credentials
  FOR DELETE 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

-- Campaigns 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can manage campaigns" ON public.campaigns
  FOR ALL 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

-- Campaign metrics 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view campaign metrics" ON public.campaign_metrics
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_metrics.campaign_id
      AND c.team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
    )
  );

-- Sync logs 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view sync logs" ON public.sync_logs
  FOR SELECT 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Service role can manage sync logs" ON public.sync_logs
  FOR ALL 
  TO service_role
  USING (auth.role() = 'service_role');

-- Manual campaigns 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view manual campaigns" ON public.manual_campaigns
  FOR SELECT 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can create manual campaigns" ON public.manual_campaigns
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Team members can update manual campaigns" ON public.manual_campaigns
  FOR UPDATE 
  TO authenticated
  USING (
    team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
  );

CREATE POLICY "Masters can delete manual campaigns" ON public.manual_campaigns
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = manual_campaigns.team_id
      AND t.master_user_id = (SELECT auth.uid())
    )
  );

-- Manual campaign metrics 정책 (성능 최적화 적용)
CREATE POLICY "Team members can view manual metrics" ON public.manual_campaign_metrics
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.manual_campaigns mc
      WHERE mc.id = manual_campaign_metrics.manual_campaign_id
      AND mc.team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
    )
  );

CREATE POLICY "Team members can manage manual metrics" ON public.manual_campaign_metrics
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.manual_campaigns mc
      WHERE mc.id = manual_campaign_metrics.manual_campaign_id
      AND mc.team_id IN (SELECT team_id FROM public.user_teams((SELECT auth.uid())))
    )
  );

-- OAuth states 정책 (성능 최적화 적용)
CREATE POLICY "Users can manage their oauth states" ON public.oauth_states
  FOR ALL 
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can manage oauth states" ON public.oauth_states
  FOR ALL 
  TO service_role
  USING (auth.role() = 'service_role');

CREATE POLICY "Anonymous users can view oauth states" ON public.oauth_states
  FOR SELECT 
  TO anon 
  USING (true);

-- =====================================================
-- STORAGE CONFIGURATION (For hosted environments only)
-- =====================================================

-- Note: Storage configuration is skipped in local development
-- These would be applied in hosted Supabase environments

-- DO $$
-- BEGIN
--   -- 아바타 스토리지 버킷 생성 (hosted only)
--   IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
--     INSERT INTO storage.buckets (id, name, public) 
--     VALUES ('avatars', 'avatars', true) 
--     ON CONFLICT (id) DO NOTHING;
--     
--     -- 아바타 스토리지 정책
--     CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
--       FOR SELECT USING (bucket_id = 'avatars');
--     
--     CREATE POLICY "Users can upload their own avatar" ON storage.objects
--       FOR INSERT WITH CHECK (
--         bucket_id = 'avatars' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--       );
--     
--     CREATE POLICY "Users can update their own avatar" ON storage.objects
--       FOR UPDATE USING (
--         bucket_id = 'avatars' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--       );
--     
--     CREATE POLICY "Users can delete their own avatar" ON storage.objects
--       FOR DELETE USING (
--         bucket_id = 'avatars' AND 
--         auth.uid()::text = (storage.foldername(name))[1]
--       );
--   END IF;
-- END;
-- $$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- 스키마 권한 부여
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- 인증된 사용자 권한
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 익명 사용자 권한 (제한적)
GRANT SELECT ON public.team_invitations TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.user_teams(UUID) TO anon;

-- 특정 함수 권한
GRANT EXECUTE ON FUNCTION public.ensure_user_has_team(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_has_team() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_teams(UUID) TO authenticated;

-- =====================================================
-- TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE public.sync_logs IS '각 플랫폼 통합의 동기화 이력을 추적하는 테이블';
COMMENT ON TABLE public.platform_credentials IS 
'플랫폼 자격증명 테이블 - OAuth 토큰은 최상위 컬럼(access_token, refresh_token, expires_at, scope)에 저장됨. 
data JSONB 컬럼에는 user_email, user_id, connected_at 같은 민감하지 않은 메타데이터만 포함.
credentials JSONB 컬럼에는 Sivera OAuth를 사용하지 않을 때 OAuth 클라이언트 자격증명(client_id, client_secret) 포함.';
COMMENT ON TABLE public.manual_campaigns IS 'API가 없는 플랫폼(예: 쿠팡)의 캠페인 데이터를 수동으로 관리하기 위한 테이블';
COMMENT ON TABLE public.oauth_states IS 'OAuth 2.0 CSRF 공격 방지를 위한 state 파라미터 저장 테이블';
COMMENT ON COLUMN platform_credentials.error_message IS 'Error message from last token refresh attempt, null if successful';

-- =====================================================
-- SEED DATA (for development)
-- =====================================================

-- Note: 개발용 시드 데이터는 별도 seed.sql 파일에서 관리

-- =====================================================
-- END OF UNIFIED SCHEMA
-- =====================================================

SELECT 'Unified schema with RLS performance optimizations applied successfully!' as message;