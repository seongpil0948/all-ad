-- =====================================================
-- Add customer_id column to platform_credentials table
-- Generated on: 2025-07-05
-- Description: Add missing customer_id column for Google Ads integration
-- =====================================================

-- Add customer_id column to platform_credentials table
ALTER TABLE public.platform_credentials
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Add index for customer_id for better performance
CREATE INDEX IF NOT EXISTS idx_platform_credentials_customer_id 
ON public.platform_credentials(customer_id) 
WHERE customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.platform_credentials.customer_id IS 'Platform-specific customer/account ID (e.g., Google Ads Customer ID, Facebook Ad Account ID)';

-- Update existing Google Ads credentials if they have customer ID in account_id
UPDATE public.platform_credentials
SET customer_id = account_id
WHERE platform = 'google' 
  AND customer_id IS NULL 
  AND account_id ~ '^[0-9]+$'; -- Only numeric account IDs that look like customer IDs

SELECT 'customer_id column added successfully to platform_credentials table!' AS status;