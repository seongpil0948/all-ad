-- =====================================================
-- Ensure All Users Have Teams
-- =====================================================

-- First, let's see which users don't have teams
DO $$
DECLARE
  user_count INTEGER;
  users_without_teams INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Total users: %', user_count;
  
  -- Count users without teams
  SELECT COUNT(*) INTO users_without_teams
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.teams t WHERE t.master_user_id = u.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id
  );
  
  RAISE NOTICE 'Users without teams: %', users_without_teams;
END $$;

-- Create teams for all users who don't have one
INSERT INTO public.teams (name, master_user_id)
SELECT 
  COALESCE(u.email, 'My Team'),
  u.id
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.teams t WHERE t.master_user_id = u.id
)
AND NOT EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id
);

-- Verify the results
DO $$
DECLARE
  users_without_teams INTEGER;
BEGIN
  -- Count users without teams after fix
  SELECT COUNT(*) INTO users_without_teams
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.teams t WHERE t.master_user_id = u.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.team_members tm WHERE tm.user_id = u.id
  );
  
  RAISE NOTICE 'Users without teams after fix: %', users_without_teams;
END $$;

-- Also fix the handle_new_user trigger to ensure it's properly set
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- List all teams to verify
SELECT 
  t.id as team_id,
  t.name as team_name,
  t.master_user_id,
  u.email as master_email,
  t.created_at
FROM public.teams t
LEFT JOIN auth.users u ON t.master_user_id = u.id
ORDER BY t.created_at DESC;