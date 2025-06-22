import { cache } from "react";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

// Cache the team ID retrieval to prevent duplicate queries
export const getTeamId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Check for team ID in cookies first
  const cookieStore = await cookies();
  const teamIdCookie = cookieStore.get("team_id");

  if (teamIdCookie?.value) {
    return teamIdCookie.value;
  }

  // If not in cookies, fetch from database
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .single();

  return teamMember?.team_id || null;
});

// Cache user role retrieval
export const getUserRole = cache(async (): Promise<string | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const teamId = await getTeamId();

  if (!teamId) {
    return null;
  }

  const { data: teamMember } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .single();

  return teamMember?.role || null;
});

// Cache user profile retrieval
export const getUserProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});
