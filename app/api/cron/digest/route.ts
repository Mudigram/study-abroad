import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ResendPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate using Bearer token (should match SUPABASE_SERVICE_ROLE_KEY)
  const authHeader = request.headers.get("authorization");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createAdminClient();

    // 2. Fetch all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name");

    if (profilesError) throw new Error(profilesError.message);
    if (!profiles || profiles.length === 0) {
      return Response.json({ success: true, message: "No profiles found." });
    }

    // Date range configurations: next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split("T")[0];
    const sevenDaysLaterStr = sevenDaysLater.toISOString().split("T")[0];

    let emailsSent = 0;

    // 3. Compile digest for each user
    for (const profile of profiles) {
      // Get user email from admin API
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        profile.id,
      );

      if (userError || !userData?.user?.email) {
        console.error(`Failed to fetch email for user ${profile.id}:`, userError?.message);
        continue;
      }

      const email = userData.user.email;

      // Fetch upcoming application deadlines
      const { data: apps, error: appsError } = await supabase
        .from("applications")
        .select("id, university_name, program_name, deadline")
        .eq("user_id", profile.id)
        .gte("deadline", todayStr)
        .lte("deadline", sevenDaysLaterStr);

      if (appsError) {
        console.error(`Apps query error for user ${profile.id}:`, appsError.message);
        continue;
      }

      // Fetch upcoming incomplete requirements
      const { data: reqs, error: reqsError } = await supabase
        .from("application_requirements")
        .select("id, label, due_date, status, application_id")
        .eq("user_id", profile.id)
        .neq("status", "Done")
        .gte("due_date", todayStr)
        .lte("due_date", sevenDaysLaterStr);

      if (reqsError) {
        console.error(`Reqs query error for user ${profile.id}:`, reqsError.message);
        continue;
      }

      const hasAppDeadlines = apps && apps.length > 0;
      const hasReqDeadlines = reqs && reqs.length > 0;

      if (!hasAppDeadlines && !hasReqDeadlines) {
        // Nothing due in the next 7 days, skip email
        continue;
      }

      // Compile Email HTML Body
      let htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #fafafa;">
          <h2 style="color: #4f46e5; margin-top: 0;">Application OS Digest</h2>
          <p style="color: #475569; font-size: 14px;">Hello ${profile.full_name || "Applicant"}, here are your upcoming milestones due in the next 7 days (<strong>${todayStr}</strong> to <strong>${sevenDaysLaterStr}</strong>):</p>
      `;

      if (hasAppDeadlines) {
        htmlBody += `
          <h3 style="color: #0f172a; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Program Application Deadlines</h3>
          <ul style="list-style-type: none; padding-left: 0;">
        `;
        for (const app of apps) {
          htmlBody += `
            <li style="padding: 10px; margin-bottom: 8px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <strong style="color: #0f172a;">${app.program_name}</strong><br/>
              <span style="font-size: 12px; color: #64748b;">${app.university_name}</span><br/>
              <span style="font-size: 12px; color: #ef4444; font-weight: bold;">Due: ${new Date(app.deadline!).toLocaleDateString()}</span>
            </li>
          `;
        }
        htmlBody += `</ul>`;
      }

      if (hasReqDeadlines) {
        htmlBody += `
          <h3 style="color: #0f172a; margin-top: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">Document Checklist Deadlines</h3>
          <ul style="list-style-type: none; padding-left: 0;">
        `;
        for (const req of reqs) {
          const app = apps?.find((a) => a.id === req.application_id);
          const detail = app ? `${app.program_name} at ${app.university_name}` : "Checklist requirement";
          htmlBody += `
            <li style="padding: 10px; margin-bottom: 8px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <strong style="color: #0f172a;">${req.label}</strong><br/>
              <span style="font-size: 12px; color: #64748b;">${detail}</span><br/>
              <span style="font-size: 12px; color: #f59e0b; font-weight: bold;">Due: ${new Date(req.due_date!).toLocaleDateString()} · Status: ${req.status}</span>
            </li>
          `;
        }
        htmlBody += `</ul>`;
      }

      htmlBody += `
          <p style="color: #94a3b8; font-size: 11px; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            This is an automated digest sent by your Application OS workspace.
          </p>
        </div>
      `;

      // 4. Send Email via Resend
      const resendKey = process.env.RESEND_API_KEY;

      if (!resendKey || resendKey.trim() === "" || resendKey.trim() === "Keys") {
        console.warn(`Resend API Key is not set or using placeholder. Logged digest HTML for user ${email}:\n`, htmlBody);
        emailsSent++;
        continue;
      }

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Application OS <onboarding@resend.dev>",
          to: [email],
          subject: "Application OS: Upcoming Deadlines Digest",
          html: htmlBody,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error(`Resend API failure for user ${email}:`, resendRes.status, errorText);
      } else {
        emailsSent++;
      }
    }

    return Response.json({ success: true, emailsSent });
  } catch (error) {
    console.error("Digest cron error:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
}
