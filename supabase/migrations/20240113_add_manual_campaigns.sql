-- Manual campaigns table for platforms without API support (e.g., Coupang)
CREATE TABLE IF NOT EXISTS manual_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('coupang')),
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'ended')),
  budget DECIMAL(15, 2),
  spent DECIMAL(15, 2) DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  notes TEXT,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, platform, external_id)
);

-- Manual campaign metrics table for daily tracking
CREATE TABLE IF NOT EXISTS manual_campaign_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manual_campaign_id UUID NOT NULL REFERENCES manual_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spent DECIMAL(15, 2) DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(manual_campaign_id, date)
);

-- Enable RLS
ALTER TABLE manual_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_campaign_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for manual_campaigns
CREATE POLICY "Team members can view their manual campaigns"
  ON manual_campaigns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = manual_campaigns.team_id
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert manual campaigns"
  ON manual_campaigns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = manual_campaigns.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('master', 'team_mate')
    )
  );

CREATE POLICY "Team members can update their manual campaigns"
  ON manual_campaigns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = manual_campaigns.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role IN ('master', 'team_mate')
    )
  );

CREATE POLICY "Masters can delete manual campaigns"
  ON manual_campaigns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = manual_campaigns.team_id
        AND team_members.user_id = auth.uid()
        AND team_members.role = 'master'
    )
  );

-- RLS policies for manual_campaign_metrics
CREATE POLICY "Team members can view their manual campaign metrics"
  ON manual_campaign_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manual_campaigns mc
      JOIN team_members tm ON tm.team_id = mc.team_id
      WHERE mc.id = manual_campaign_metrics.manual_campaign_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can insert manual campaign metrics"
  ON manual_campaign_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM manual_campaigns mc
      JOIN team_members tm ON tm.team_id = mc.team_id
      WHERE mc.id = manual_campaign_metrics.manual_campaign_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('master', 'team_mate')
    )
  );

CREATE POLICY "Team members can update manual campaign metrics"
  ON manual_campaign_metrics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM manual_campaigns mc
      JOIN team_members tm ON tm.team_id = mc.team_id
      WHERE mc.id = manual_campaign_metrics.manual_campaign_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('master', 'team_mate')
    )
  );

-- Indexes for performance
CREATE INDEX idx_manual_campaigns_team_id ON manual_campaigns(team_id);
CREATE INDEX idx_manual_campaigns_platform ON manual_campaigns(platform);
CREATE INDEX idx_manual_campaigns_status ON manual_campaigns(status);
CREATE INDEX idx_manual_campaign_metrics_campaign_id ON manual_campaign_metrics(manual_campaign_id);
CREATE INDEX idx_manual_campaign_metrics_date ON manual_campaign_metrics(date);

-- Function to update last_updated_at
CREATE OR REPLACE FUNCTION update_manual_campaign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_updated_at
CREATE TRIGGER update_manual_campaigns_updated_at
  BEFORE UPDATE ON manual_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_campaign_updated_at();