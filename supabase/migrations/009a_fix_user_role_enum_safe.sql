-- Alternative approach: Create a completely new column and migrate data
-- This avoids the policy constraint issues

-- First check if we need to do this migration
DO $$
BEGIN
  -- Check if 'team_mate' already exists in user_role enum
  IF EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'team_mate' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    -- Already migrated, skip
    RETURN;
  END IF;

  -- Create new enum type with correct values
  CREATE TYPE user_role_v2 AS ENUM ('master', 'viewer', 'team_mate');

  -- Add new column with new type
  ALTER TABLE team_members ADD COLUMN role_v2 user_role_v2;

  -- Copy data with transformation
  UPDATE team_members 
  SET role_v2 = CASE 
    WHEN role::text = 'editor' THEN 'team_mate'::user_role_v2
    ELSE role::text::user_role_v2
  END;

  -- Drop old column (this will also drop any policies referencing it)
  ALTER TABLE team_members DROP COLUMN role CASCADE;

  -- Rename new column to original name
  ALTER TABLE team_members RENAME COLUMN role_v2 TO role;

  -- Set default
  ALTER TABLE team_members ALTER COLUMN role SET DEFAULT 'viewer'::user_role_v2;

  -- Make not null
  ALTER TABLE team_members ALTER COLUMN role SET NOT NULL;

  -- Drop old enum if exists
  DROP TYPE IF EXISTS user_role CASCADE;

  -- Rename new enum to original name
  ALTER TYPE user_role_v2 RENAME TO user_role;
END $$;