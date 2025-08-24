"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Server action to manually trigger a cron job via its mapped edge function.
 * Expects a FormData with a `jobName` field.
 */
export async function triggerCronJobAction(formData: FormData) {
  const jobName = formData.get("jobName");
  if (typeof jobName !== "string" || !jobName) {
    throw new Error("Missing jobName");
  }

  const functionMap: Record<string, string> = {
    "refresh-oauth-tokens": "refresh-tokens",
    "google-ads-sync-hourly": "google-ads-sync",
    "google-ads-sync-full-daily": "google-ads-sync-full",
  };

  const functionName = functionMap[jobName];
  if (!functionName) {
    throw new Error(`Unknown job name: ${jobName}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.functions.invoke(functionName, {
    body: { trigger: "manual" },
  });

  if (error) {
    // Re-throw to surface in server action boundary (could be caught for toast in client enhancement)
    throw error;
  }
}
