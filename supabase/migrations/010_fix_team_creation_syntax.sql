-- Fix the syntax error in team creation functions
-- The issue is with the string concatenation using three single quotes

-- First, drop the existing function and trigger
DROP TRIGGER IF EXISTS on_profile_created_create_team ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_user_team_creation() CASCADE;

-- Recreate the function with proper string escaping
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

  -- Create a new team for the user with proper string concatenation
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(NEW.full_name, NEW.email, 'My') || ' Team', NEW.id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'master'::user_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return NEW to not block user creation
    RAISE WARNING 'Error creating team for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_profile_created_create_team
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_team_creation();

-- Also fix the create_team_for_user function
DROP FUNCTION IF EXISTS public.create_team_for_user(UUID) CASCADE;

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

  -- Create a new team with proper string concatenation
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_name, user_email, 'My') || ' Team', user_id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, user_id, 'master'::user_role);
  
  RETURN new_team_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error creating team for user %: %', user_id, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team_for_user TO authenticated;

-- Fix any existing team names that might have incorrect formatting
UPDATE public.teams
SET name = REPLACE(name, '''s Team', ' Team')
WHERE name LIKE '%''s Team';