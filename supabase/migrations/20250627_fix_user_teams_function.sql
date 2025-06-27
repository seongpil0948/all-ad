-- =====================================================
-- Fix user_teams Function Parameter Ambiguity
-- =====================================================

-- We cannot change parameter names, so we'll use table aliases to fix ambiguity
CREATE OR REPLACE FUNCTION public.user_teams(user_id UUID)
RETURNS TABLE(team_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id AS team_id
  FROM public.teams t
  WHERE t.master_user_id = $1  -- Use positional parameter to avoid ambiguity
  UNION
  SELECT tm.team_id AS team_id
  FROM public.team_members tm
  WHERE tm.user_id = $1;  -- Use positional parameter to avoid ambiguity
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;