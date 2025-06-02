-- Fix team creation for existing users and ensure trigger works properly

-- First, create teams for existing users who don't have one
INSERT INTO public.teams (name, master_user_id)
SELECT 
  COALESCE(p.full_name, p.email) || '''s Team',
  p.id
FROM public.profiles p
LEFT JOIN public.teams t ON t.master_user_id = p.id
LEFT JOIN public.team_members tm ON tm.user_id = p.id
WHERE t.id IS NULL AND tm.id IS NULL;

-- Add team members entries for users who are masters but not in team_members
INSERT INTO public.team_members (team_id, user_id, role)
SELECT 
  t.id,
  t.master_user_id,
  'master'::user_role
FROM public.teams t
LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.user_id = t.master_user_id
WHERE tm.id IS NULL;

-- Drop and recreate the trigger function with better error handling
DROP FUNCTION IF EXISTS public.handle_user_team_creation() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_user_team_creation()
RETURNS trigger AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Check if user already has a team (either as master or member)
  IF EXISTS (
    SELECT 1 FROM public.teams WHERE master_user_id = NEW.id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Create a new team for the user
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(NEW.full_name, NEW.email, 'My') || '''s Team', NEW.id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'master'::user_role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_profile_created_create_team ON public.profiles;
CREATE TRIGGER on_profile_created_create_team
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_team_creation();

-- Also create a function to manually create team for a user
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Check if user already has a team
  IF EXISTS (
    SELECT 1 FROM public.teams WHERE master_user_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_members.user_id = create_team_for_user.user_id
  ) THEN
    -- Return existing team id
    SELECT COALESCE(
      (SELECT id FROM public.teams WHERE master_user_id = create_team_for_user.user_id),
      (SELECT team_id FROM public.team_members WHERE team_members.user_id = create_team_for_user.user_id LIMIT 1)
    ) INTO new_team_id;
    RETURN new_team_id;
  END IF;

  -- Get user info
  SELECT email, full_name INTO user_email, user_name
  FROM public.profiles
  WHERE id = user_id;

  -- Create a new team
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_name, user_email, 'My') || '''s Team', user_id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, user_id, 'master'::user_role);
  
  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team_for_user TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_teams_master_user ON public.teams(master_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
