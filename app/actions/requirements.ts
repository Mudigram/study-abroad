"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Application,
  ApplicationRequirement,
  RequirementTemplate,
  RequirementTemplateItem,
  RequirementStatus,
} from "@/lib/types/database";

export interface RequirementsActionState {
  error?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// Applications list for requirements routing/linking
// ---------------------------------------------------------------------------

export async function getApplications(): Promise<Application[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Application[];
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Application | null;
}

// ---------------------------------------------------------------------------
// Template Actions
// ---------------------------------------------------------------------------

export async function getTemplates(): Promise<RequirementTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // RLS allows selecting if is_shared = true OR created_by = user.id
  const { data, error } = await supabase
    .from("requirement_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RequirementTemplate[];
}

export async function createTemplate(
  name: string,
  country: string | null,
  items: RequirementTemplateItem[],
  isShared = false,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!name.trim()) {
    return { error: "Template name is required." };
  }

  if (items.length === 0) {
    return { error: "At least one item is required." };
  }

  for (const item of items) {
    if (!item.label.trim() || !item.category.trim()) {
      return { error: "Each item must have a label and category." };
    }
  }

  const { error } = await supabase.from("requirement_templates").insert({
    name: name.trim(),
    country: country && country.trim() ? country.trim() : null,
    items,
    created_by: user.id,
    is_shared: isShared,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/requirements");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Application Requirements Actions
// ---------------------------------------------------------------------------

export async function getRequirements(
  applicationId: string,
): Promise<ApplicationRequirement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("application_requirements")
    .select("*")
    .eq("application_id", applicationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ApplicationRequirement[];
}

export async function applyTemplateToApplication(
  applicationId: string,
  templateId: string,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch application to get deadline
  const app = await getApplication(applicationId);
  if (!app) {
    return { error: "Application not found." };
  }

  // 2. Fetch template
  const { data: template, error: templateError } = await supabase
    .from("requirement_templates")
    .select("*")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return { error: "Template not found." };
  }

  const items = template.items as RequirementTemplateItem[];
  const inserts = items.map((item) => {
    let dueDate: string | null = null;
    if (app.deadline && item.default_due_offset_days !== null) {
      const deadlineDate = new Date(app.deadline);
      deadlineDate.setDate(deadlineDate.getDate() + item.default_due_offset_days);
      dueDate = deadlineDate.toISOString().split("T")[0];
    }

    return {
      application_id: applicationId,
      user_id: user.id,
      label: item.label,
      category: item.category,
      status: "Not Started" as const,
      due_date: dueDate,
    };
  });

  const { error: insertError } = await supabase
    .from("application_requirements")
    .insert(inserts);

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/requirements`);
  return { success: true };
}

export async function addCustomRequirement(
  applicationId: string,
  label: string,
  category: string | null,
  dueDate: string | null,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!label.trim()) {
    return { error: "Label is required." };
  }

  const { error } = await supabase.from("application_requirements").insert({
    application_id: applicationId,
    user_id: user.id,
    label: label.trim(),
    category: category && category.trim() ? category.trim() : null,
    status: "Not Started",
    due_date: dueDate && dueDate.trim() ? dueDate : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/requirements`);
  return { success: true };
}

export async function updateRequirementStatus(
  requirementId: string,
  status: RequirementStatus,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("application_requirements")
    .update({ status })
    .eq("id", requirementId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/requirements`);
  return { success: true };
}

export async function updateRequirementDueDate(
  requirementId: string,
  dueDate: string | null,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("application_requirements")
    .update({ due_date: dueDate && dueDate.trim() ? dueDate : null })
    .eq("id", requirementId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/requirements`);
  return { success: true };
}

export async function deleteRequirement(
  requirementId: string,
): Promise<RequirementsActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("application_requirements")
    .delete()
    .eq("id", requirementId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/requirements`);
  return { success: true };
}
