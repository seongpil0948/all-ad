-- Add OAuth credentials columns to platform_credentials table
-- This allows each team to use their own OAuth apps instead of environment variables

-- Add user_id column to track who connected the account
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add account_id column for platform-specific account identifier
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'account_id'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN account_id TEXT;
  END IF;
END $$;

-- Add account_name column for display purposes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'account_name'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN account_name TEXT;
  END IF;
END $$;

-- Add data column for OAuth and other configuration data
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add last_synced_at column for tracking sync status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update unique constraint to include account_id
-- First drop the old constraint if it exists
ALTER TABLE public.platform_credentials 
DROP CONSTRAINT IF EXISTS platform_credentials_team_id_platform_key;

-- Add new unique constraint
ALTER TABLE public.platform_credentials 
ADD CONSTRAINT platform_credentials_team_id_platform_account_id_key 
UNIQUE(team_id, platform, account_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_credentials_user_id 
ON public.platform_credentials(user_id);

CREATE INDEX IF NOT EXISTS idx_platform_credentials_account_id 
ON public.platform_credentials(account_id);

-- Update RLS policies to allow users to manage their own credentials
CREATE POLICY "Users can manage their own credentials" ON public.platform_credentials
  FOR ALL USING (user_id = auth.uid() OR team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = auth.uid() AND role IN ('master', 'team_mate')
  ));