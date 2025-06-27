-- =====================================================
-- Add OAuth Token Columns to platform_credentials Table
-- =====================================================

-- Add OAuth-specific columns for token management
ALTER TABLE public.platform_credentials
ADD COLUMN IF NOT EXISTS access_token TEXT,
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scope TEXT;

-- Create indexes for token expiration checks
CREATE INDEX IF NOT EXISTS idx_platform_credentials_expires_at 
ON public.platform_credentials(expires_at) 
WHERE expires_at IS NOT NULL;

-- Update existing records to move tokens from data column to new columns
UPDATE public.platform_credentials
SET 
  access_token = COALESCE((data->>'access_token')::TEXT, (credentials->>'access_token')::TEXT),
  refresh_token = COALESCE((data->>'refresh_token')::TEXT, (credentials->>'refresh_token')::TEXT),
  expires_at = CASE 
    WHEN data->>'expires_at' IS NOT NULL THEN (data->>'expires_at')::TIMESTAMP WITH TIME ZONE
    WHEN credentials->>'expires_at' IS NOT NULL THEN (credentials->>'expires_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END,
  scope = COALESCE((data->>'scope')::TEXT, (credentials->>'scope')::TEXT)
WHERE platform IN ('google', 'facebook')
AND access_token IS NULL;