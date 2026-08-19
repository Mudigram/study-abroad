import { redirect } from "next/navigation";

import { ensureProfile, getProfile } from "@/app/actions/profile";
import { ProfileSetupForm } from "@/components/profile/profile-setup-form";
import { isProfileComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = (await getProfile()) ?? (await ensureProfile());

  if (isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <ProfileSetupForm profile={profile} />
    </div>
  );
}
