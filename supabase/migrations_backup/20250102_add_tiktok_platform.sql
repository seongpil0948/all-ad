-- Add TikTok to platform_type enum
ALTER TYPE platform_type ADD VALUE IF NOT EXISTS 'tiktok';

-- Add TikTok specific columns to platform_credentials if needed
ALTER TABLE platform_credentials 
ADD COLUMN IF NOT EXISTS tiktok_advertiser_id TEXT,
ADD COLUMN IF NOT EXISTS tiktok_business_center_id TEXT;

-- Create index for TikTok advertiser IDs
CREATE INDEX IF NOT EXISTS idx_platform_credentials_tiktok_advertiser 
ON platform_credentials(tiktok_advertiser_id) 
WHERE platform = 'tiktok';