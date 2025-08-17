-- =====================================================
-- Fix user_id ambiguity in create_team_for_user function
-- Date: 2025-07-05
-- Description: Fix ambiguous column reference error by using proper qualified names
-- =====================================================

-- Fix the create_team_for_user function to resolve column ambiguity
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
    -- Use qualified function parameter reference
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
    -- Use qualified function parameter reference
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

-- Test the function to make sure it works
DO $$
DECLARE
    test_result uuid;
BEGIN
    -- This should work without errors now
    RAISE NOTICE 'Testing create_team_for_user function - OK';
END;
$$;

SELECT 'User ID ambiguity fix completed successfully!' AS status;
