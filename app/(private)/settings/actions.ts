"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { platformDB } from "@/services/platform-database.service";
import { platformServiceFactory } from "@/services/platforms/platform-service-factory";
import { PlatformType } from "@/types/platform";

export async function savePlatformCredentials(
  platform: PlatformType,
  credentials: Record<string, any>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const team = await platformDB.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // Validate credentials
  const service = platformServiceFactory.createService(platform);

  service.setCredentials(credentials);
  const isValid = await service.validateCredentials();

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Save credentials
  const success = await platformDB.savePlatformCredentials(
    team.id,
    platform,
    credentials,
    user.id,
  );

  if (!success) {
    throw new Error("Failed to save credentials");
  }

  revalidatePath("/settings");
}

export async function deletePlatformCredentials(platform: PlatformType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const team = await platformDB.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  const success = await platformDB.deletePlatformCredentials(team.id, platform);

  if (!success) {
    throw new Error("Failed to delete credentials");
  }

  revalidatePath("/settings");
}

export async function togglePlatformCredentials(
  platform: PlatformType,
  isActive: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  // Get user's team
  const team = await platformDB.getUserTeam(user.id);

  if (!team) {
    throw new Error("User has no team");
  }

  // Update the is_active status in the database
  const { error } = await supabase
    .from("platform_credentials")
    .update({ is_active: isActive })
    .eq("team_id", team.id)
    .eq("platform", platform);

  if (error) {
    throw new Error("Failed to toggle platform credentials");
  }

  revalidatePath("/settings");
}

export async function getTeamCredentials() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get user's team
  const team = await platformDB.getUserTeam(user.id);

  if (!team) {
    return [];
  }

  return await platformDB.getTeamCredentials(team.id);
}
