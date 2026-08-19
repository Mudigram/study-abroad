import type { Profile } from "@/lib/types/database";

export function isProfileComplete(profile: Profile): boolean {
  return Boolean(profile.full_name?.trim() && profile.home_country?.trim());
}
