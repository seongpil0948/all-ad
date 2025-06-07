-- Create sync_logs table for tracking platform data synchronization
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  sync_type TEXT CHECK (sync_type IN ('FULL', 'INCREMENTAL')) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  records_processed INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_sync_logs_team_platform ON public.sync_logs(team_id, platform);
CREATE INDEX idx_sync_logs_status ON public.sync_logs(status);
CREATE INDEX idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- Add RLS policies
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sync logs for their team
CREATE POLICY "Users can view their team sync logs" ON public.sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = sync_logs.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Policy: Only system can insert/update sync logs
CREATE POLICY "System can manage sync logs" ON public.sync_logs
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Grant necessary permissions
GRANT SELECT ON public.sync_logs TO authenticated;

-- Add comment
COMMENT ON TABLE public.sync_logs IS 'Tracks synchronization history for each platform integration';