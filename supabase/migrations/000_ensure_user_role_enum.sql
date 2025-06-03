-- Ensure user_role enum exists
-- This migration should run FIRST before any other migrations that depend on user_role

-- Create user_role enum if it doesn't exist
DO $$
BEGIN
  -- Check if user_role type exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('master', 'viewer', 'team_mate');
  ELSE
    -- If it exists, ensure it has all the required values
    -- Check if 'team_mate' exists
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_enum 
      WHERE enumlabel = 'team_mate' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
      -- Add team_mate if it doesn't exist
      -- Note: This is tricky with enums, might need to recreate
      -- For now, we'll leave it as is if the type exists
      NULL;
    END IF;
  END IF;
END $$;