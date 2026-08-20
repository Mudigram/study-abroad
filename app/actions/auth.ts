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

export async function signInWithPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  if (typeof password !== "string" || !password.trim()) {
    return { error: "Password is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}


