-- Enable required extensions for cron jobs
-- Note: pg_net and pg_cron extensions might not be available in all environments
-- This is wrapped in a function to prevent migration failures
do $$
begin
  -- Try to create pg_net extension
  if exists (
    select 1 from pg_available_extensions 
    where name = 'pg_net'
  ) then
    create extension if not exists pg_net schema extensions;
    raise notice 'pg_net extension enabled';
  else
    raise notice 'pg_net extension not available in this environment';
  end if;
  
  -- Try to create pg_cron extension
  if exists (
    select 1 from pg_available_extensions 
    where name = 'pg_cron'
  ) then
    create extension if not exists pg_cron schema extensions;
    raise notice 'pg_cron extension enabled';
  else
    raise notice 'pg_cron extension not available in this environment';
  end if;
exception
  when others then
    raise warning 'Could not enable extensions: %', sqlerrm;
end;
$$;

-- Grant necessary permissions (safe to run even if extensions aren't available)
grant usage on schema extensions to postgres;
grant execute on all functions in schema extensions to postgres;

-- Create function to call edge functions (used by cron jobs)
-- This function only works if pg_net extension is available
create or replace function public.call_edge_function(
  function_name text,
  payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  service_role_key text;
  supabase_url text;
  http_post_exists boolean;
begin
  -- Check if http_post function exists (pg_net extension)
  select exists(
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'extensions' 
    and p.proname = 'http_post'
  ) into http_post_exists;
  
  if not http_post_exists then
    raise warning 'pg_net extension not available, cannot call edge function %', function_name;
    return null;
  end if;
  
  -- Get service role key and URL from app settings
  service_role_key := current_setting('app.settings.jwt_secret', true);
  supabase_url := current_setting('app.supabase_url', true);
  
  -- If settings are not available, use defaults for local development
  if service_role_key is null then
    service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  end if;
  
  if supabase_url is null then
    supabase_url := 'http://localhost:54321';
  end if;
  
  -- Make HTTP request to Edge Function
  execute format(
    'select extensions.http_post($1, $2, $3, $4)::bigint'
  ) using
    supabase_url || '/functions/v1/' || function_name,
    payload,
    jsonb_build_object(
      'Authorization', 'Bearer ' || service_role_key,
      'Content-Type', 'application/json'
    ),
    5000 -- timeout
  into request_id;
  
  return request_id;
exception
  when others then
    -- Log error and return null
    raise warning 'Error calling edge function %: %', function_name, sqlerrm;
    return null;
end;
$$;

-- Grant execute permission on the function
grant execute on function public.call_edge_function to postgres;

-- Create cron jobs table if not exists
create table if not exists public.cron_jobs (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  schedule text not null,
  command text not null,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sample cron jobs (disabled by default to avoid errors)
-- These can be enabled once the edge functions are deployed
insert into public.cron_jobs (name, schedule, command, enabled) values
  ('refresh-oauth-tokens', '0 * * * *', 'select public.call_edge_function(''refresh-oauth-tokens'', ''{}'');', false),
  ('sync-campaigns-hourly', '10 * * * *', 'select public.call_edge_function(''sync-campaigns'', ''{}'');', false),
  ('sync-campaigns-daily', '0 2 * * *', 'select public.call_edge_function(''sync-campaigns-full'', ''{}'');', false)
on conflict (name) do nothing;

-- Function to manage cron jobs
-- This function only works if pg_cron extension is available
create or replace function public.manage_cron_job()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  cron_schedule_exists boolean;
begin
  -- Check if cron_schedule function exists (pg_cron extension)
  select exists(
    select 1 from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'extensions' 
    and p.proname = 'cron_schedule'
  ) into cron_schedule_exists;
  
  if not cron_schedule_exists then
    raise warning 'pg_cron extension not available, cannot manage cron job %', coalesce(new.name, old.name);
    return new;
  end if;
  
  if tg_op = 'INSERT' then
    if new.enabled then
      execute format(
        'select extensions.cron_schedule($1, $2, $3)'
      ) using new.name, new.schedule, new.command;
    end if;
  elsif tg_op = 'UPDATE' then
    -- Remove old job
    execute format(
      'select extensions.cron_unschedule($1)'
    ) using old.name;
    
    -- Add new job if enabled
    if new.enabled then
      execute format(
        'select extensions.cron_schedule($1, $2, $3)'
      ) using new.name, new.schedule, new.command;
    end if;
  elsif tg_op = 'DELETE' then
    execute format(
      'select extensions.cron_unschedule($1)'
    ) using old.name;
  end if;
  
  return new;
exception
  when others then
    raise warning 'Error managing cron job %: %', coalesce(new.name, old.name), sqlerrm;
    return new;
end;
$$;

-- Create trigger to automatically manage cron jobs
create trigger manage_cron_jobs_trigger
  after insert or update or delete on public.cron_jobs
  for each row
  execute function public.manage_cron_job();

-- Add RLS policies for cron_jobs table
alter table public.cron_jobs enable row level security;

-- Only allow superusers to manage cron jobs
create policy "Only superusers can manage cron jobs"
  on public.cron_jobs
  for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Comment on the function
comment on function public.call_edge_function is 'Helper function to call Supabase Edge Functions from cron jobs using pg_net extension';
comment on table public.cron_jobs is 'Table to manage cron jobs dynamically';