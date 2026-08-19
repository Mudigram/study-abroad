"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface TrackerActionState {
  error?: string;
  success?: boolean;
}

export interface ProcessingTracker {
  id: string;
  user_id: string;
  application_id: string | null;
  type: "evaluation" | "visa";
  agency: string;
  status: string;
  tracking_number: string | null;
  appointment_date: string | null;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getTrackers(): Promise<ProcessingTracker[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("processing_trackers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProcessingTracker[];
}

// ---------------------------------------------------------------------------
// Writes (CRUD)
// ---------------------------------------------------------------------------

export async function createTracker(
  applicationId: string | null,
  type: "evaluation" | "visa",
  agency: string,
  status: string,
  trackingNumber: string | null,
  appointmentDate: string | null,
  notes: string | null,
): Promise<TrackerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!agency.trim()) {
    return { error: "Agency name is required." };
  }
  if (!status.trim()) {
    return { error: "Status description is required." };
  }

  const { error } = await supabase.from("processing_trackers").insert({
    user_id: user.id,
    application_id: applicationId && applicationId.trim() ? applicationId : null,
    type,
    agency: agency.trim(),
    status: status.trim(),
    tracking_number: trackingNumber && trackingNumber.trim() ? trackingNumber.trim() : null,
    appointment_date: appointmentDate && appointmentDate.trim() ? appointmentDate : null,
    notes: notes && notes.trim() ? notes.trim() : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deadlines");
  return { success: true };
}

export async function updateTracker(
  id: string,
  applicationId: string | null,
  type: "evaluation" | "visa",
  agency: string,
  status: string,
  trackingNumber: string | null,
  appointmentDate: string | null,
  notes: string | null,
): Promise<TrackerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!agency.trim()) {
    return { error: "Agency name is required." };
  }
  if (!status.trim()) {
    return { error: "Status description is required." };
  }

  const { error } = await supabase
    .from("processing_trackers")
    .update({
      application_id: applicationId && applicationId.trim() ? applicationId : null,
      type,
      agency: agency.trim(),
      status: status.trim(),
      tracking_number: trackingNumber && trackingNumber.trim() ? trackingNumber.trim() : null,
      appointment_date: appointmentDate && appointmentDate.trim() ? appointmentDate : null,
      notes: notes && notes.trim() ? notes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deadlines");
  return { success: true };
}

export async function deleteTracker(id: string): Promise<TrackerActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("processing_trackers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/deadlines");
  return { success: true };
}
