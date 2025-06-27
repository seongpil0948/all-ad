-- =====================================================
-- Update Google Ads Customer IDs
-- =====================================================

-- This is a temporary fix to update the account_id for existing Google Ads credentials
-- In production, this would be done automatically during OAuth callback

-- Update the specific credential that's causing issues
UPDATE public.platform_credentials
SET 
  account_id = '7702718698',  -- Replace with actual Google Ads customer ID
  account_name = 'Google Ads - 7702718698'
WHERE 
  platform = 'google'
  AND account_id LIKE 'google_%'
  AND is_active = true
  LIMIT 1;

-- Note: In a real scenario, you would need to:
-- 1. Use the Google Ads API to get accessible customers
-- 2. Update each credential with the correct customer ID
-- 3. This is just a placeholder to demonstrate the fix