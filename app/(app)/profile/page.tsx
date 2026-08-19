import { Metadata } from "next";
import { getProfile } from "@/app/actions/profile";
import { FullProfileForm } from "@/components/profile/full-profile-form";
import { User, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Profile & Preferences | Application OS",
  description: "Configure your academic profile, budget allocation, base currency, and study abroad preferences.",
};

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-black text-indigo-700 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Applicant Account & Settings</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Manage your personal academic identity, FX base currency, total budget, and notification alerts.
          </p>
        </div>
      </div>

      {/* Form */}
      <FullProfileForm profile={profile} />
    </div>
  );
}
