-- Create platform types enum
CREATE TYPE platform_type AS ENUM ('facebook', 'google', 'kakao', 'naver', 'coupang');

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('master', 'viewer', 'editor');

-- Create teams table (organization level)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  master_user_id UUID REFERENCES auth.users(id) NOT NULL,
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

-- Create platform credentials table
CREATE TABLE IF NOT EXISTS public.platform_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  credentials JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(team_id, platform)
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  platform_campaign_id TEXT NOT NULL,
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

-- Create campaign metrics table for time-series data
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for teams
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master users can update their teams" ON public.teams
  FOR UPDATE USING (master_user_id = auth.uid());

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (master_user_id = auth.uid());

-- Create policies for team_members
CREATE POLICY "Team members can view team members" ON public.team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master and editor can manage team members" ON public.team_members
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      LEFT JOIN public.team_members tm ON t.id = tm.team_id
      WHERE t.master_user_id = auth.uid() 
         OR (tm.user_id = auth.uid() AND tm.role = 'editor')
    )
  );

-- Create policies for platform_credentials
CREATE POLICY "Team members can view credentials" ON public.platform_credentials
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master and editor can manage credentials" ON public.platform_credentials
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      LEFT JOIN public.team_members tm ON t.id = tm.team_id
      WHERE t.master_user_id = auth.uid() 
         OR (tm.user_id = auth.uid() AND tm.role = 'editor')
    )
  );

-- Create policies for campaigns
CREATE POLICY "Team members can view campaigns" ON public.campaigns
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Master and editor can manage campaigns" ON public.campaigns
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM public.teams t
      LEFT JOIN public.team_members tm ON t.id = tm.team_id
      WHERE t.master_user_id = auth.uid() 
         OR (tm.user_id = auth.uid() AND tm.role = 'editor')
    )
  );

-- Create policies for campaign_metrics
CREATE POLICY "Team members can view metrics" ON public.campaign_metrics
  FOR SELECT USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.team_members tm ON c.team_id = tm.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage metrics" ON public.campaign_metrics
  FOR ALL USING (true);

-- Create function to handle first user as master
CREATE OR REPLACE FUNCTION public.handle_user_team_creation()
RETURNS trigger AS $$
BEGIN
  -- Create a default team for the user if they don't have one
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE user_id = NEW.id
  ) THEN
    -- Create team
    INSERT INTO public.teams (name, master_user_id)
    VALUES (NEW.email || '''s Team', NEW.id);
    
    -- Add user as master member
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (
      (SELECT id FROM public.teams WHERE master_user_id = NEW.id LIMIT 1),
      NEW.id,
      'master'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for team creation
CREATE TRIGGER on_profile_created_create_team
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_team_creation();

-- Create indexes for performance
CREATE INDEX idx_campaigns_team_platform ON public.campaigns(team_id, platform);
CREATE INDEX idx_campaign_metrics_campaign_date ON public.campaign_metrics(campaign_id, date);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
