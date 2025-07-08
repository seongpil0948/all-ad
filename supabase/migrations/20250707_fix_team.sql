-- =====================================================
-- Fix Team Members Consistency
-- Date: 2025-01-06
-- Description: Ensure all team masters have corresponding team_members records
-- =====================================================

-- 1. Check current state
DO $$
DECLARE
    missing_count INT;
    duplicate_teams_count INT;
BEGIN
    -- Count masters without team_members records
    SELECT COUNT(*) INTO missing_count
    FROM public.teams t
    WHERE NOT EXISTS (
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = t.id AND tm.user_id = t.master_user_id
    );
    
    -- Count users with multiple teams as master
    SELECT COUNT(*) INTO duplicate_teams_count
    FROM (
        SELECT master_user_id, COUNT(*) as team_count
        FROM public.teams
        GROUP BY master_user_id
        HAVING COUNT(*) > 1
    ) AS duplicates;
    
    RAISE NOTICE 'Found % masters without team_members records', missing_count;
    RAISE NOTICE 'Found % users with multiple teams as master', duplicate_teams_count;
END $$;

-- 2. Fix missing team_members records for existing masters
INSERT INTO public.team_members (team_id, user_id, role, joined_at)
SELECT 
    t.id as team_id,
    t.master_user_id as user_id,
    'master'::user_role as role,
    t.created_at as joined_at
FROM public.teams t
WHERE NOT EXISTS (
    SELECT 1 FROM public.team_members tm 
    WHERE tm.team_id = t.id AND tm.user_id = t.master_user_id
)
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 3. Handle users with multiple teams (keep only the oldest)
WITH duplicate_teams AS (
    SELECT 
        master_user_id,
        id as team_id,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY master_user_id ORDER BY created_at ASC) as rn
    FROM public.teams
),
teams_to_delete AS (
    SELECT team_id
    FROM duplicate_teams
    WHERE rn > 1
)
-- Log teams that would be deleted (for safety, not actually deleting)
SELECT 
    'Team ' || team_id || ' would be deleted (duplicate for user)' as action
FROM teams_to_delete;

-- 4. Update the create_team_for_user function to be more defensive
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_team_id uuid;
    user_email text;
    existing_team_count int;
BEGIN
    -- Check if user already has a team as master
    SELECT t.id INTO new_team_id
    FROM public.teams t
    WHERE t.master_user_id = create_team_for_user.user_id
    ORDER BY t.created_at ASC
    LIMIT 1;
    
    IF new_team_id IS NOT NULL THEN
        -- Ensure team_members record exists
        INSERT INTO public.team_members (team_id, user_id, role)
        VALUES (new_team_id, create_team_for_user.user_id, 'master')
        ON CONFLICT (team_id, user_id) DO NOTHING;
        
        RETURN new_team_id;
    END IF;
    
    -- Check if user is already in team_members
    SELECT tm.team_id INTO new_team_id
    FROM public.team_members tm
    WHERE tm.user_id = create_team_for_user.user_id
    ORDER BY tm.joined_at ASC
    LIMIT 1;
    
    IF new_team_id IS NOT NULL THEN
        RETURN new_team_id;
    END IF;
    
    -- Get user email for team name
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = create_team_for_user.user_id;
    
    -- Create new team
    INSERT INTO public.teams (name, master_user_id)
    VALUES (COALESCE(user_email, 'My Team'), create_team_for_user.user_id)
    RETURNING id INTO new_team_id;
    
    -- Add user as master to team_members
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, create_team_for_user.user_id, 'master')
    ON CONFLICT (team_id, user_id) DO NOTHING;
    
    RETURN new_team_id;
END;
$$;

-- 5. Add a constraint to ensure data integrity (commented out for safety)
-- ALTER TABLE public.teams 
-- ADD CONSTRAINT teams_master_must_be_member 
-- CHECK (
--     EXISTS (
--         SELECT 1 FROM public.team_members tm 
--         WHERE tm.team_id = teams.id 
--         AND tm.user_id = teams.master_user_id
--     )
-- );

-- 6. Verification
DO $$
DECLARE
    missing_count INT;
    total_teams INT;
    total_masters INT;
BEGIN
    -- Count masters without team_members records after fix
    SELECT COUNT(*) INTO missing_count
    FROM public.teams t
    WHERE NOT EXISTS (
        SELECT 1 FROM public.team_members tm 
        WHERE tm.team_id = t.id AND tm.user_id = t.master_user_id
    );
    
    -- Count total teams and masters
    SELECT COUNT(*) INTO total_teams FROM public.teams;
    SELECT COUNT(DISTINCT master_user_id) INTO total_masters FROM public.teams;
    
    RAISE NOTICE 'After fix: % masters still without team_members records', missing_count;
    RAISE NOTICE 'Total teams: %, Total unique masters: %', total_teams, total_masters;
    
    IF missing_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All team masters now have team_members records!';
    ELSE
        RAISE WARNING 'Some masters still missing team_members records';
    END IF;
END $$;

-- 7. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_team 
ON public.team_members(user_id, team_id);

-- 8. Add a trigger to ensure consistency going forward
CREATE OR REPLACE FUNCTION public.ensure_master_in_team_members()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- When a team is created, ensure master is in team_members
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.team_members (team_id, user_id, role)
        VALUES (NEW.id, NEW.master_user_id, 'master')
        ON CONFLICT (team_id, user_id) DO NOTHING;
    END IF;
    
    -- When master_user_id is updated
    IF TG_OP = 'UPDATE' AND OLD.master_user_id != NEW.master_user_id THEN
        -- Remove old master from team_members if they're only a master
        DELETE FROM public.team_members
        WHERE team_id = NEW.id 
        AND user_id = OLD.master_user_id 
        AND role = 'master';
        
        -- Add new master to team_members
        INSERT INTO public.team_members (team_id, user_id, role)
        VALUES (NEW.id, NEW.master_user_id, 'master')
        ON CONFLICT (team_id, user_id) 
        DO UPDATE SET role = 'master';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_master_in_team_members_trigger ON public.teams;
CREATE TRIGGER ensure_master_in_team_members_trigger
AFTER INSERT OR UPDATE OF master_user_id ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.ensure_master_in_team_members();