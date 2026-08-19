import { redirect } from "next/navigation";

import { getProfile } from "@/app/actions/profile";
import { isProfileComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();

  if (!profile || !isProfileComplete(profile)) {
    redirect("/profile/setup");
  }

  redirect("/dashboard");
}
