import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard content will be added here */}
        <div className="bg-default-100 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">환영합니다!</h2>
          <p className="text-default-600">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
