"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isProfileComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface ProfileActionState {
  error?: string;
  success?: boolean;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
}

export async function ensureProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const existing = await getProfile();
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: user.id })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile;
}

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = formData.get("full_name");
  const homeCountry = formData.get("home_country");
  const highestDegree = formData.get("highest_degree");
  const yoeValue = formData.get("yoe");
  const totalBudgetValue = formData.get("total_budget");
  const baseCurrency = formData.get("base_currency");

  if (typeof fullName !== "string" || !fullName.trim()) {
    return { error: "Full name is required." };
  }

  if (typeof homeCountry !== "string" || !homeCountry.trim()) {
    return { error: "Home country is required." };
  }

  const yoe =
    typeof yoeValue === "string" && yoeValue.trim()
      ? Number.parseInt(yoeValue, 10)
      : 0;

  if (Number.isNaN(yoe) || yoe < 0) {
    return { error: "Years of experience must be zero or greater." };
  }

  const totalBudget =
    typeof totalBudgetValue === "string" && totalBudgetValue.trim()
      ? Number.parseFloat(totalBudgetValue)
      : 0;

  if (Number.isNaN(totalBudget) || totalBudget < 0) {
    return { error: "Total budget must be zero or greater." };
  }

  const currency =
    typeof baseCurrency === "string" && baseCurrency.trim()
      ? baseCurrency.trim().toUpperCase()
      : "USD";

  await ensureProfile();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName.trim(),
      home_country: homeCountry.trim(),
      highest_degree:
        typeof highestDegree === "string" && highestDegree.trim()
          ? highestDegree.trim()
          : null,
      yoe,
      total_budget: totalBudget,
      base_currency: currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile/setup");

  const profile = await getProfile();
  if (profile && isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  return { success: true };
}
