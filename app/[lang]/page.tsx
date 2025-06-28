import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

interface HomeProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomeProps) {
  const { lang } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // If user is logged in, redirect to dashboard
    redirect(`/${lang}/dashboard`);
  } else {
    // If user is not logged in, redirect to intro page
    redirect(`/${lang}/intro`);
  }
}
