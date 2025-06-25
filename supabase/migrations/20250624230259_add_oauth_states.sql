-- Create oauth_states table for CSRF protection
CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add index for state lookup
CREATE INDEX idx_oauth_states_state ON public.oauth_states(state);

-- Add index for cleanup
CREATE INDEX idx_oauth_states_created_at ON public.oauth_states(created_at);

-- RLS policies
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Users can only access their own states
CREATE POLICY "Users can create their own oauth states"
  ON public.oauth_states
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own oauth states"
  ON public.oauth_states
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own oauth states"
  ON public.oauth_states
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up old states (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM public.oauth_states
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up old states
-- This requires pg_cron extension which may need to be enabled
-- SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_old_oauth_states();');