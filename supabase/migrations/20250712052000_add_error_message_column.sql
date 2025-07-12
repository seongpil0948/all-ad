-- Add error_message column to platform_credentials table
ALTER TABLE platform_credentials ADD COLUMN error_message TEXT;

-- Add comment explaining the new column
COMMENT ON COLUMN platform_credentials.error_message IS 'Error message from last token refresh attempt, null if successful';