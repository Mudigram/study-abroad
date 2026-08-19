import { redirect } from "next/navigation";

import { getProfile } from "@/app/actions/profile";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { ToastProvider } from "@/components/ui/toast";
import { isProfileComplete } from "@/lib/profile";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  const profile = await getProfile();

  if (!profile || !isProfileComplete(profile)) {
    redirect("/profile/setup");
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5]">
        <AppSidebar userName={profile.full_name} />
        <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          <TopHeader userName={profile.full_name} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}


