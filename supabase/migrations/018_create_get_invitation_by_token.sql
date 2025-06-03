-- Create a function to get invitation by token
-- This bypasses any potential RLS issues for public access

CREATE OR REPLACE FUNCTION get_invitation_by_token(invitation_token UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'invitation', row_to_json(inv.*),
    'team', row_to_json(t.*),
    'inviter', row_to_json(p.*)
  ) INTO result
  FROM team_invitations inv
  LEFT JOIN teams t ON t.id = inv.team_id
  LEFT JOIN profiles p ON p.id = inv.invited_by
  WHERE inv.token = invitation_token
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO anon, authenticated;

-- Also create a simpler debug function
CREATE OR REPLACE FUNCTION debug_get_all_invitation_tokens()
RETURNS TABLE(token UUID, email TEXT, status TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ti.token, ti.email, ti.status
  FROM team_invitations ti
  ORDER BY ti.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION debug_get_all_invitation_tokens() TO anon, authenticated;