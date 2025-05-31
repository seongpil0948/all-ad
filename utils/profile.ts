import { createClient } from "@/utils/supabase/client";
import { Profile } from "@/types/database.types";

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
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
  
  // Generate unique file name
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload file to storage
  const { data, error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
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
  
  // Extract file path from URL
  const urlParts = avatarUrl.split("/");
  const fileName = urlParts[urlParts.length - 1];

  const { error } = await supabase.storage
    .from("avatars")
    .remove([fileName]);

  if (error) {
    console.error("Delete error:", error);
    throw error;
  }
}
