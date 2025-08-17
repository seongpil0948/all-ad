-- Create custom types
create type platform_type as enum (
  'google_ads',
  'facebook_ads',
  'kakao_ads',
  'naver_ads',
  'coupang_ads',
  'amazon_ads',
  'tiktok_ads'
);

create type member_role as enum ('master', 'team_mate', 'viewer');
create type invitation_status as enum ('pending', 'accepted', 'rejected', 'expired');
create type credential_status as enum ('active', 'expired', 'invalid', 'refreshing');

-- Create profiles table
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create teams table
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create team_members table
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role member_role default 'viewer' not null,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

-- Create team_invitations table
create table team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  email text not null,
  role member_role default 'viewer' not null,
  token text unique not null default gen_random_uuid()::text,
  status invitation_status default 'pending' not null,
  invited_by uuid references auth.users not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users,
  constraint valid_email check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint valid_expiry check (expires_at > created_at),
  constraint valid_acceptance check (
    (status = 'accepted' and accepted_at is not null and accepted_by is not null) or
    (status != 'accepted' and accepted_at is null and accepted_by is null)
  )
);

-- Create platform_credentials table
create table platform_credentials (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  platform platform_type not null,
  account_id text,
  account_name text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  additional_data jsonb default '{}'::jsonb,
  status credential_status default 'active' not null,
  error_message text,
  last_refreshed_at timestamptz,
  created_by uuid references auth.users not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create campaigns table
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  platform platform_type not null,
  platform_campaign_id text not null,
  credential_id uuid references platform_credentials on delete cascade not null,
  name text not null,
  status text,
  budget numeric(12, 2),
  currency text default 'KRW',
  start_date date,
  end_date date,
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(team_id, platform, platform_campaign_id)
);

-- Create campaign_metrics table
create table campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  campaign_id uuid references campaigns on delete cascade not null,
  date date not null,
  impressions bigint default 0,
  clicks bigint default 0,
  cost numeric(12, 2) default 0,
  conversions bigint default 0,
  revenue numeric(12, 2) default 0,
  ctr numeric(10, 4),
  cpc numeric(12, 2),
  cpm numeric(12, 2),
  roas numeric(10, 2),
  roi numeric(10, 2),
  raw_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(campaign_id, date)
);

-- Create activity_logs table
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams on delete cascade not null,
  user_id uuid references auth.users on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Create indexes for better performance
create index idx_profiles_email on profiles(email);
create index idx_team_members_team_id on team_members(team_id);
create index idx_team_members_user_id on team_members(user_id);
create index idx_platform_credentials_team_id on platform_credentials(team_id);
create index idx_campaigns_team_id on campaigns(team_id);
create index idx_campaigns_platform on campaigns(platform);
create index idx_campaign_metrics_campaign_id on campaign_metrics(campaign_id);
create index idx_campaign_metrics_date on campaign_metrics(date);
create index idx_activity_logs_team_id on activity_logs(team_id);
create index idx_activity_logs_created_at on activity_logs(created_at);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_invitations enable row level security;
alter table platform_credentials enable row level security;
alter table campaigns enable row level security;
alter table campaign_metrics enable row level security;
alter table activity_logs enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- RLS Policies for teams
create policy "Team members can view their teams"
  on teams for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Masters can update their teams"
  on teams for update
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = teams.id
      and team_members.user_id = auth.uid()
      and team_members.role = 'master'
    )
  );

create policy "Users can create teams"
  on teams for insert
  with check (auth.uid() = created_by);

-- RLS Policies for team_members
create policy "Team members can view team members"
  on team_members for select
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
    )
  );

create policy "Masters can manage team members"
  on team_members for all
  using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
      and tm.role = 'master'
    )
  );

-- RLS Policies for platform_credentials
create policy "Team members can view credentials"
  on platform_credentials for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = platform_credentials.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Masters and team_mates can manage credentials"
  on platform_credentials for all
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = platform_credentials.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('master', 'team_mate')
    )
  );

-- RLS Policies for campaigns
create policy "Team members can view campaigns"
  on campaigns for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = campaigns.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "Masters and team_mates can manage campaigns"
  on campaigns for all
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = campaigns.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('master', 'team_mate')
    )
  );

-- RLS Policies for campaign_metrics
create policy "Team members can view metrics"
  on campaign_metrics for select
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = campaign_metrics.team_id
      and team_members.user_id = auth.uid()
    )
  );

create policy "System can manage metrics"
  on campaign_metrics for all
  using (
    exists (
      select 1 from team_members
      where team_members.team_id = campaign_metrics.team_id
      and team_members.user_id = auth.uid()
      and team_members.role in ('master', 'team_mate')
    )
  );

-- Functions
create or replace function handle_new_user()
returns trigger as $$
declare
  new_team_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Create default team
  insert into public.teams (name, description, created_by)
  values (
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)) || '''s Team',
    'Default team',
    new.id
  )
  returning id into new_team_id;
  
  -- Add user as master of the team
  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, new.id, 'master');
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_teams_updated_at before update on teams
  for each row execute procedure update_updated_at_column();

create trigger update_platform_credentials_updated_at before update on platform_credentials
  for each row execute procedure update_updated_at_column();

create trigger update_campaigns_updated_at before update on campaigns
  for each row execute procedure update_updated_at_column();

create trigger update_campaign_metrics_updated_at before update on campaign_metrics
  for each row execute procedure update_updated_at_column();