-- Comprehensive fix for all enum and function issues
-- This migration ensures everything is properly set up

-- 1. Ensure platform_type enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE platform_type AS ENUM ('facebook', 'google', 'kakao', 'naver', 'coupang');
  END IF;
END $$;

-- 2. Fix user_role enum
DO $$
BEGIN
  -- First, check if user_role exists at all
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Create it fresh with correct values
    CREATE TYPE user_role AS ENUM ('master', 'viewer', 'team_mate');
  ELSE
    -- Check if it has the old 'editor' value
    IF EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumlabel = 'editor' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      -- Need to recreate the enum
      -- First create a temporary type
      CREATE TYPE user_role_temp AS ENUM ('master', 'viewer', 'team_mate');
      
      -- Update all columns using user_role to use the temp type
      -- This handles the team_members table
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_members' 
        AND column_name = 'role'
        AND udt_name = 'user_role'
      ) THEN
        -- Convert editor to team_mate
        ALTER TABLE team_members 
        ALTER COLUMN role TYPE user_role_temp 
        USING CASE 
          WHEN role::text = 'editor' THEN 'team_mate'::user_role_temp
          ELSE role::text::user_role_temp
        END;
      END IF;
      
      -- Handle team_invitations table
      IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'team_invitations' 
        AND column_name = 'role'
        AND udt_name = 'user_role'
      ) THEN
        ALTER TABLE team_invitations 
        ALTER COLUMN role TYPE user_role_temp 
        USING CASE 
          WHEN role::text = 'editor' THEN 'team_mate'::user_role_temp
          ELSE role::text::user_role_temp
        END;
      END IF;
      
      -- Drop the old type
      DROP TYPE user_role CASCADE;
      
      -- Rename temp to user_role
      ALTER TYPE user_role_temp RENAME TO user_role;
    END IF;
  END IF;
END $$;

-- 3. Fix the handle_user_team_creation function with proper string concatenation
CREATE OR REPLACE FUNCTION public.handle_user_team_creation()
RETURNS trigger AS $$
DECLARE
  new_team_id UUID;
  team_name TEXT;
BEGIN
  -- Check if user already has a team (either as master or member)
  IF EXISTS (
    SELECT 1 FROM public.teams WHERE master_user_id = NEW.id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members WHERE user_id = NEW.id
  ) THEN
    RETURN NEW;
  END IF;

  -- Build team name with proper concatenation
  team_name := COALESCE(NEW.full_name, NEW.email, 'My') || ' Team';

  -- Create a new team for the user
  INSERT INTO public.teams (name, master_user_id)
  VALUES (team_name, NEW.id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'master'::user_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error creating team for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_profile_created_create_team ON public.profiles;
CREATE TRIGGER on_profile_created_create_team
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_team_creation();

-- 5. Fix create_team_for_user function
CREATE OR REPLACE FUNCTION public.create_team_for_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  new_team_id UUID;
  user_email TEXT;
  user_name TEXT;
  team_name TEXT;
BEGIN
  -- Check if user already has a team
  IF EXISTS (
    SELECT 1 FROM public.teams WHERE master_user_id = user_id
  ) THEN
    -- Return existing team id
    SELECT id INTO new_team_id FROM public.teams WHERE master_user_id = user_id;
    RETURN new_team_id;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.team_members WHERE team_members.user_id = create_team_for_user.user_id
  ) THEN
    -- Return existing team id from team_members
    SELECT team_id INTO new_team_id 
    FROM public.team_members 
    WHERE team_members.user_id = create_team_for_user.user_id 
    LIMIT 1;
    RETURN new_team_id;
  END IF;

  -- Get user info
  SELECT email, full_name INTO user_email, user_name
  FROM public.profiles
  WHERE id = user_id;

  -- Build team name
  team_name := COALESCE(user_name, user_email, 'My') || ' Team';

  -- Create a new team
  INSERT INTO public.teams (name, master_user_id)
  VALUES (team_name, user_id)
  RETURNING id INTO new_team_id;
  
  -- Add user as master member
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, user_id, 'master'::user_role);
  
  RETURN new_team_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating team for user %: %', user_id, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_team_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_user_team_creation TO authenticated;

-- 7. Ensure invitation status type exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invitation_status') THEN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
  END IF;
END $$;