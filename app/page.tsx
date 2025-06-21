import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If user is logged in, redirect to dashboard
    redirect("/dashboard");
  } else {
    // If user is not logged in, redirect to intro page
    redirect("/intro");
  }
}
