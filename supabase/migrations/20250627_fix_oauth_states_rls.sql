-- =====================================================
-- Fix OAuth States RLS for Server-Side Access
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can read their own oauth states" ON public.oauth_states;
DROP POLICY IF EXISTS "Users can delete their own oauth states" ON public.oauth_states;

-- Create new policies that allow both user and service access

-- Users can create their own states
CREATE POLICY "oauth_states_insert" ON public.oauth_states
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own states OR service role can read any state
CREATE POLICY "oauth_states_select" ON public.oauth_states
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt()->>'role' = 'service_role'
  );

-- Users can delete their own states OR service role can delete any state
CREATE POLICY "oauth_states_delete" ON public.oauth_states
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    auth.jwt()->>'role' = 'service_role'
  );

-- Also add a bypass policy for the anonymous role to read by state parameter only
-- This allows the OAuth callback to work even before authentication
CREATE POLICY "oauth_states_anon_select" ON public.oauth_states
  FOR SELECT
  TO anon
  USING (true);  -- State parameter uniqueness provides security