-- Ensure all required team-related functions exist

-- 1. Drop and recreate get_team_members_with_profiles function
DROP FUNCTION IF EXISTS public.get_team_members_with_profiles(UUID);

CREATE OR REPLACE FUNCTION public.get_team_members_with_profiles(team_id_param UUID)
RETURNS TABLE(
  id UUID,
  team_id UUID,
  user_id UUID,
  role user_role,
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE,
  profile_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.role,
    tm.invited_by,
    tm.joined_at,
    p.id as profile_id,
    p.email,
    p.full_name,
    p.avatar_url
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON tm.user_id = p.id
  WHERE tm.team_id = team_id_param
  ORDER BY tm.joined_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_team_members_with_profiles TO authenticated;

-- 2. Ensure check_team_member_limit function exists (might be needed)
CREATE OR REPLACE FUNCTION public.check_team_member_limit(team_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_count INTEGER;
  max_members INTEGER := 10; -- Default limit
BEGIN
  -- Count current team members
  SELECT COUNT(*) INTO member_count
  FROM public.team_members
  WHERE team_id = team_id_param;
  
  -- Return true if under limit
  RETURN member_count < max_members;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_team_member_limit TO authenticated;

-- 3. Create a function to get team details with member count
CREATE OR REPLACE FUNCTION public.get_team_details(team_id_param UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  master_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  member_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.master_user_id,
    t.created_at,
    t.updated_at,
    COUNT(tm.id) as member_count
  FROM public.teams t
  LEFT JOIN public.team_members tm ON t.id = tm.team_id
  WHERE t.id = team_id_param
  GROUP BY t.id, t.name, t.master_user_id, t.created_at, t.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_team_details TO authenticated;

-- 4. Create a function to check if user can invite team members
CREATE OR REPLACE FUNCTION public.can_invite_team_members(check_user_id UUID, check_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  is_master BOOLEAN;
BEGIN
  -- Check if user is team master
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE id = check_team_id AND master_user_id = check_user_id
  ) INTO is_master;
  
  IF is_master THEN
    RETURN TRUE;
  END IF;
  
  -- Check user's role in team
  SELECT role INTO user_role_val
  FROM public.team_members
  WHERE team_id = check_team_id AND user_id = check_user_id;
  
  -- Masters and team_mates can invite
  RETURN user_role_val IN ('master', 'team_mate');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.can_invite_team_members TO authenticated;