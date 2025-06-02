-- Create RPC function to create team for user
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
BEGIN
  -- Check if user already has a team
  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE team_members.user_id = create_team_for_user.user_id
  ) THEN
    -- Return existing team id
    SELECT team_id INTO new_team_id 
    FROM public.team_members 
    WHERE team_members.user_id = create_team_for_user.user_id 
    LIMIT 1;
    
    RETURN new_team_id;
  END IF;

  -- Get user email for team name
  -- Create new team
  INSERT INTO public.teams (name, master_user_id)
  SELECT 
    COALESCE(p.email, 'Team ' || substring(create_team_for_user.user_id::text, 1, 8)),
    create_team_for_user.user_id
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = create_team_for_user.user_id
  RETURNING id INTO new_team_id;

  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, create_team_for_user.user_id, 'master');

  RETURN new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team_for_user TO authenticated;

-- Also fix the policy for teams to allow master to view their own team
CREATE POLICY "Master users can view their own teams" ON public.teams
  FOR SELECT USING (master_user_id = auth.uid());
