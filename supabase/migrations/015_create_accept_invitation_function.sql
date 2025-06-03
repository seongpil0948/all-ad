-- Create function to accept team invitations
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invitation_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_invitation RECORD;
  v_user_id UUID;
  v_team_id UUID;
  v_result JSONB;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE token = invitation_token
  AND status = 'pending';

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if invitation has expired
  IF v_invitation.expires_at < NOW() THEN
    -- Update invitation status to expired
    UPDATE public.team_invitations
    SET status = 'expired'
    WHERE token = invitation_token;
    
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Check if user email matches invitation email
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = v_user_id
    AND email = v_invitation.email
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;

  -- Check if user is already a member of the team
  IF EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = v_invitation.team_id
    AND user_id = v_user_id
  ) THEN
    -- Update invitation status
    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE token = invitation_token;
    
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of this team');
  END IF;

  -- Check if user is the master of the team
  IF EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = v_invitation.team_id
    AND master_user_id = v_user_id
  ) THEN
    -- Update invitation status
    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE token = invitation_token;
    
    RETURN jsonb_build_object('success', false, 'error', 'You are already the master of this team');
  END IF;

  -- Begin transaction to add user to team
  BEGIN
    -- Add user to team
    INSERT INTO public.team_members (team_id, user_id, role, invited_by, joined_at)
    VALUES (v_invitation.team_id, v_user_id, v_invitation.role, v_invitation.invited_by, NOW());

    -- Update invitation status
    UPDATE public.team_invitations
    SET status = 'accepted',
        accepted_at = NOW()
    WHERE token = invitation_token;

    -- Get team details for response
    v_team_id := v_invitation.team_id;

    RETURN jsonb_build_object(
      'success', true,
      'team_id', v_team_id,
      'role', v_invitation.role
    );

  EXCEPTION
    WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Failed to accept invitation: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_team_invitation TO authenticated;

-- Also create a function to decline invitation
CREATE OR REPLACE FUNCTION public.decline_team_invitation(invitation_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Update invitation status
  UPDATE public.team_invitations
  SET status = 'cancelled'
  WHERE token = invitation_token
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decline_team_invitation TO authenticated;