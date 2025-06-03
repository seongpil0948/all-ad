CREATE OR REPLACE FUNCTION handle_new_user_with_invitation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_token UUID;
  invitation_record RECORD;
BEGIN
  -- First, create the profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Check if user has an invitation token in metadata
  invitation_token := (NEW.raw_user_meta_data->>'invitation_token')::UUID;
  
  IF invitation_token IS NOT NULL THEN
    -- Try to accept the invitation
    SELECT * INTO invitation_record
    FROM team_invitations
    WHERE token = invitation_token
      AND status = 'pending'
      AND expires_at > NOW()
      AND email = NEW.email;
      
    IF invitation_record IS NOT NULL THEN
      -- Add user to team
      INSERT INTO team_members (team_id, user_id, role, invited_by)
      VALUES (invitation_record.team_id, NEW.id, invitation_record.role, invitation_record.invited_by);
      
      -- Update invitation status
      UPDATE team_invitations 
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = invitation_record.id;
      
      -- Log successful auto-acceptance
      RAISE NOTICE 'User % auto-accepted invitation to team %', NEW.id, invitation_record.team_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_with_invitation();
