-- Add missing columns to tables if they don't exist

-- Add synced_at column to platform_credentials if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'synced_at'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN synced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add last_sync_at column to platform_credentials if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'platform_credentials' 
    AND column_name = 'last_sync_at'
  ) THEN
    ALTER TABLE public.platform_credentials 
    ADD COLUMN last_sync_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add missing columns to campaigns table if they don't exist
DO $$ 
BEGIN
  -- Add account_id column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'account_id'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN account_id TEXT;
  END IF;

  -- Add budget_type column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'budget_type'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN budget_type TEXT;
  END IF;

  -- Add start_date column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN start_date DATE;
  END IF;

  -- Add end_date column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'campaigns' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.campaigns 
    ADD COLUMN end_date DATE;
  END IF;
END $$;