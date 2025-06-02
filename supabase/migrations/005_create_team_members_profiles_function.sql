-- Create function to get team members with profiles
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
