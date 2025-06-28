import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/types";
import log from "@/utils/logger";

export async function getProfileServer(
  userId: string,
): Promise<Profile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    log.error("Error fetching profile", error, {
      module: "profile-utils-server",
      function: "getProfileServer",
      userId,
    });

    return null;
  }

  return data;
}

export async function updateProfileServer(
  userId: string,
  updates: Partial<Profile>,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
