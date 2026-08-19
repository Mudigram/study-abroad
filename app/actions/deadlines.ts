"use server";

import { createClient } from "@/lib/supabase/server";
import type { ApplicationRequirement, Application } from "@/lib/types/database";

export interface DeadlineItem {
  id: string;
  type: "requirement" | "application";
  title: string;
  subtitle: string;
  dueDate: string;
  status: string;
}

/**
 * Fetches all upcoming deadline items (both application deadlines and requirement due dates)
 * for the current user, sorted chronologically.
 */
export async function getUpcomingDeadlines(): Promise<DeadlineItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch applications
  const { data: apps, error: appsError } = await supabase
    .from("applications")
    .select("id, university_name, program_name, deadline, status")
    .eq("user_id", user.id);

  if (appsError) throw new Error(appsError.message);

  // Fetch requirements
  const { data: reqs, error: reqsError } = await supabase
    .from("application_requirements")
    .select("id, label, due_date, status, application_id")
    .eq("user_id", user.id);

  if (reqsError) throw new Error(reqsError.message);

  const items: DeadlineItem[] = [];

  // 1. Add application deadlines
  for (const app of apps ?? []) {
    if (app.deadline) {
      items.push({
        id: `app_${app.id}`,
        type: "application",
        title: `Submit application for ${app.program_name}`,
        subtitle: app.university_name,
        dueDate: app.deadline,
        status: app.status || "Discovery",
      });
    }
  }

  // 2. Add requirement deadlines
  for (const req of reqs ?? []) {
    if (req.due_date && req.status !== "Done") {
      const app = (apps ?? []).find((a) => a.id === req.application_id);
      items.push({
        id: `req_${req.id}`,
        type: "requirement",
        title: req.label,
        subtitle: app ? `${app.program_name} at ${app.university_name}` : "Requirement",
        dueDate: req.due_date,
        status: req.status,
      });
    }
  }

  // Sort chronologically (earliest first)
  return items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
