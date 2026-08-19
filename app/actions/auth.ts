"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface AuthActionState {
  error?: string;
  success?: boolean;
}

function getSiteOrigin(originHeader: string | null): string {
  if (originHeader) {
    return originHeader;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export async function signInWithMagicLink(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const headersList = await headers();
  const origin = getSiteOrigin(headersList.get("origin"));
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
