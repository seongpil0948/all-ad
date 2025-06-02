"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import {
  getProfile,
  updateProfile as updateProfileUtil,
} from "@/utils/profile";
import log from "@/utils/logger";

export async function getProfileData() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Fetch or create profile
    let profile = await getProfile(user.id);

    if (!profile) {
      // Create profile if it doesn't exist
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      profile = data;
    }

    return {
      user,
      profile,
    };
  } catch (error) {
    log.error("Failed to get profile data", error as Error, {
      module: "profile/actions",
      action: "getProfileData",
    });
    throw error;
  }
}

export async function updateProfileAction(formData: FormData) {
  "use server";

  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const fullName = formData.get("full_name") as string;

    await updateProfileUtil(user.id, {
      full_name: fullName,
    });

    revalidatePath("/profile");

    return { success: true, message: "프로필이 업데이트되었습니다." };
  } catch (error) {
    log.error("Failed to update profile", error as Error, {
      module: "profile/actions",
      action: "updateProfileAction",
    });

    return {
      success: false,
      message: "프로필 업데이트 중 오류가 발생했습니다.",
    };
  }
}

export async function updateAvatarAction(avatarUrl: string | null) {
  "use server";

  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    await updateProfileUtil(user.id, {
      avatar_url: avatarUrl,
    });

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    log.error("Failed to update avatar", error as Error, {
      module: "profile/actions",
      action: "updateAvatarAction",
    });

    return { success: false };
  }
}
