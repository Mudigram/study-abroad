"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Document, DocumentType } from "@/lib/types/database";

export interface DocumentActionState {
  error?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Document[];
}

// ---------------------------------------------------------------------------
// Writes (DB inserts and updates)
// ---------------------------------------------------------------------------

export async function createDocumentEntry(
  fileName: string,
  storageUrl: string,
  documentType: DocumentType,
  expiryDate: string | null,
  applicationId: string | null,
  requirementId: string | null,
): Promise<DocumentActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!fileName || !storageUrl) {
    return { error: "File details are missing." };
  }

  // 1. Insert document row
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      file_name: fileName,
      storage_url: storageUrl,
      document_type: documentType,
      expiry_date: expiryDate && expiryDate.trim() ? expiryDate : null,
      application_id: applicationId && applicationId.trim() ? applicationId : null,
    })
    .select("*")
    .single();

  if (docError || !doc) {
    return { error: docError?.message || "Failed to create document record." };
  }

  // 2. If requirementId is provided, link the requirement to this document and mark it Done
  if (requirementId) {
    const { error: reqError } = await supabase
      .from("application_requirements")
      .update({
        document_id: doc.id,
        status: "Done",
      })
      .eq("id", requirementId)
      .eq("user_id", user.id);

    if (reqError) {
      console.error("Failed to link requirement to uploaded document:", reqError.message);
    }
  }

  revalidatePath("/vault");
  revalidatePath("/requirements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDocument(
  id: string,
  storagePath: string,
): Promise<DocumentActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Unlink any application requirements referencing this document
  // Mark them back to 'In Progress' or 'Not Started' if they were marked Done (we'll set status to 'Not Started' for safety)
  const { error: unlinkError } = await supabase
    .from("application_requirements")
    .update({
      document_id: null,
      status: "Not Started",
    })
    .eq("document_id", id)
    .eq("user_id", user.id);

  if (unlinkError) {
    console.error("Unlinking requirements error:", unlinkError.message);
  }

  // 2. Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("document_vault")
    .remove([storagePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError.message);
  }

  // 3. Delete row from documents table
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath("/vault");
  revalidatePath("/requirements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getSignedUrlAction(storagePath: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("document_vault")
    .createSignedUrl(storagePath, 60);

  if (error || !data) {
    console.error("Failed to generate signed URL:", error?.message);
    return null;
  }

  return data.signedUrl;
}

export async function getAllUserRequirements() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("application_requirements")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


