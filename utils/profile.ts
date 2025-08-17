import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types";
import log from "@/utils/logger";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    log.error("Error fetching profile", error, {
      module: "profile-utils",
      function: "getProfile",
      userId,
    });

    return null;
  }

  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const supabase = createClient();

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

export async function uploadAvatar(userId: string, file: File) {
  const supabase = createClient();

  // Generate unique file name with user folder structure
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`; // Include user folder for RLS policy

  // Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    log.error("Avatar upload error", uploadError, {
      module: "profile-utils",
      function: "uploadAvatar",
      userId,
      fileName,
      fileSize: file.size,
      fileType: file.type,
    });
    throw uploadError;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

export async function deleteAvatar(avatarUrl: string) {
  const supabase = createClient();

  // Extract file path from URL (including user folder)
  const urlParts = avatarUrl.split("/");
  const fileName = urlParts[urlParts.length - 1];
  const userId = urlParts[urlParts.length - 2]; // Get user folder
  const filePath = `${userId}/${fileName}`; // Reconstruct full path

  const { error } = await supabase.storage.from("avatars").remove([filePath]);

  if (error) {
    log.error("Avatar delete error", error, {
      module: "profile-utils",
      function: "deleteAvatar",
      fileName,
      avatarUrl,
    });
    throw error;
  }
}
