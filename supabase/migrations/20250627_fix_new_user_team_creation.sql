-- =====================================================
-- Fix New User Team Creation
-- =====================================================

-- Update handle_new_user function to create team and add user as member
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Create a default team for the user
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(new.email, 'My Team'), new.id)
  RETURNING id INTO new_team_id;
  
  -- Add user as team member with master role
  -- Note: No need to insert into team_members for master_user
  -- The teams table already tracks the master_user_id
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also create a function to fix existing users without teams
CREATE OR REPLACE FUNCTION public.ensure_user_has_team(user_id_param UUID)
RETURNS UUID AS $$
DECLARE
  existing_team_id UUID;
  new_team_id UUID;
  user_email TEXT;
BEGIN
  -- Check if user already has a team (either as master or member)
  SELECT t.id INTO existing_team_id
  FROM public.teams t
  WHERE t.master_user_id = user_id_param
  LIMIT 1;
  
  IF existing_team_id IS NOT NULL THEN
    RETURN existing_team_id;
  END IF;
  
  -- Check if user is a member of any team
  SELECT tm.team_id INTO existing_team_id
  FROM public.team_members tm
  WHERE tm.user_id = user_id_param
  LIMIT 1;
  
  IF existing_team_id IS NOT NULL THEN
    RETURN existing_team_id;
  END IF;
  
  -- No team found, create one
  SELECT email INTO user_email FROM auth.users WHERE id = user_id_param;
  
  INSERT INTO public.teams (name, master_user_id)
  VALUES (COALESCE(user_email, 'My Team'), user_id_param)
  RETURNING id INTO new_team_id;
  
  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_user_has_team(UUID) TO authenticated;

-- Fix existing users without teams
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find all users without teams
  FOR user_record IN 
    SELECT u.id, u.email
    FROM auth.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.teams t WHERE t.master_user_id = u.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id
    )
  LOOP
    -- Create team for each user
    PERFORM public.ensure_user_has_team(user_record.id);
    RAISE NOTICE 'Created team for user: %', user_record.email;
  END LOOP;
END $$;