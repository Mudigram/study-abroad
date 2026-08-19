"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { searchWebDuckDuckGo } from "@/lib/ddg";
import type { Application, ApplicationStatus } from "@/lib/types/database";

export interface ApplicationActionState {
  error?: string;
  success?: boolean;
}

// ---------------------------------------------------------------------------
// CRUD Actions
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

export async function createApplication(
  _prevState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const universityName = formData.get("university_name");
  const programName = formData.get("program_name");
  const country = formData.get("country");
  const scholarshipName = formData.get("scholarship_name");
  const status = formData.get("status") || "Pathway Idea";
  const deadline = formData.get("deadline");
  const priorityRaw = formData.get("priority");
  const visaRequired = formData.get("visa_required") === "true";
  const depositRequiredRaw = formData.get("deposit_required");
  const notes = formData.get("notes");
  const researchNotes = formData.get("research_notes");
  const linkUrl = formData.get("link_url");

  if (typeof universityName !== "string" || !universityName.trim()) {
    return { error: "University name is required." };
  }
  if (typeof programName !== "string" || !programName.trim()) {
    return { error: "Program name is required." };
  }
  if (typeof country !== "string" || !country.trim()) {
    return { error: "Country is required." };
  }

  const priority =
    priorityRaw === "1" || priorityRaw === "2"
      ? (parseInt(priorityRaw) as 1 | 2)
      : null;

  const depositRequired = depositRequiredRaw
    ? parseFloat(depositRequiredRaw.toString())
    : 0;

  const { error } = await supabase.from("applications").insert({
    user_id: user.id,
    university_name: universityName.trim(),
    program_name: programName.trim(),
    country: country.trim(),
    scholarship_name:
      typeof scholarshipName === "string" && scholarshipName.trim()
        ? scholarshipName.trim()
        : null,
    status: status.toString() as ApplicationStatus,
    deadline: typeof deadline === "string" && deadline.trim() ? deadline : null,
    priority,
    visa_required: visaRequired,
    deposit_required: isNaN(depositRequired) ? 0 : depositRequired,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    research_notes:
      typeof researchNotes === "string" && researchNotes.trim()
        ? researchNotes.trim()
        : null,
    link_url: typeof linkUrl === "string" && linkUrl.trim() ? linkUrl.trim() : null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pipeline");
  revalidatePath("/requirements");
  return { success: true };
}

export async function updateApplication(
  id: string,
  _prevState: ApplicationActionState,
  formData: FormData,
): Promise<ApplicationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const universityName = formData.get("university_name");
  const programName = formData.get("program_name");
  const country = formData.get("country");
  const scholarshipName = formData.get("scholarship_name");
  const status = formData.get("status");
  const deadline = formData.get("deadline");
  const priorityRaw = formData.get("priority");
  const visaRequired = formData.get("visa_required") === "true";
  const depositRequiredRaw = formData.get("deposit_required");
  const notes = formData.get("notes");
  const researchNotes = formData.get("research_notes");
  const linkUrl = formData.get("link_url");

  if (typeof universityName !== "string" || !universityName.trim()) {
    return { error: "University name is required." };
  }
  if (typeof programName !== "string" || !programName.trim()) {
    return { error: "Program name is required." };
  }
  if (typeof country !== "string" || !country.trim()) {
    return { error: "Country is required." };
  }

  const priority =
    priorityRaw === "1" || priorityRaw === "2"
      ? (parseInt(priorityRaw) as 1 | 2)
      : null;

  const depositRequired = depositRequiredRaw
    ? parseFloat(depositRequiredRaw.toString())
    : 0;

  const { error } = await supabase
    .from("applications")
    .update({
      university_name: universityName.trim(),
      program_name: programName.trim(),
      country: country.trim(),
      scholarship_name:
        typeof scholarshipName === "string" && scholarshipName.trim()
          ? scholarshipName.trim()
          : null,
      status: status ? (status.toString() as ApplicationStatus) : undefined,
      deadline: typeof deadline === "string" && deadline.trim() ? deadline : null,
      priority,
      visa_required: visaRequired,
      deposit_required: isNaN(depositRequired) ? 0 : depositRequired,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
      research_notes:
        typeof researchNotes === "string" && researchNotes.trim()
          ? researchNotes.trim()
          : null,
      link_url: typeof linkUrl === "string" && linkUrl.trim() ? linkUrl.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/pipeline");
  revalidatePath("/requirements");
  return { success: true };
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/pipeline");
}

export async function deleteApplication(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/pipeline");
  revalidatePath("/requirements");
}

// ---------------------------------------------------------------------------
// Research Assist — Server-side call to Anthropic with DDG Search snippets
// ---------------------------------------------------------------------------

export async function triggerResearchAssist(
  applicationId: string,
): Promise<ApplicationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch application details
  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .eq("user_id", user.id)
    .single();

  if (appError || !app) {
    return { error: "Application not found." };
  }

  // 2. Fetch user profile candidate background details
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("highest_degree, yoe, home_country")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "User profile not found." };
  }

  const universityName = app.university_name;
  const programName = app.program_name;
  const country = app.country;
  const scholarshipName = app.scholarship_name || "";

  const homeCountry = profile.home_country || "Nigeria";
  const highestDegree = profile.highest_degree || "B.Sc. Computer Science";
  const yoe = profile.yoe ?? 0;

  // 3. Perform DuckDuckGo Search Pass
  const searchQuery = `${universityName} ${programName} ${scholarshipName} funding deadlines eligibility requirements`.trim();
  const searchSnippets = await searchWebDuckDuckGo(searchQuery);

  // 4. Check for Anthropic API Key config in .env.local
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey.trim() === "Keys") {
    // Development fallback mock response to avoid failing when the user's API key is not yet set
    const mockSummary = `### AI Research Assist Summary (Mock — No ANTHROPIC_API_KEY Configured)

This is a simulated summary because the Anthropic API key in your \`.env.local\` is set to the placeholder value (\`Keys\`). Please supply a valid key to trigger real searches.

#### 1. Funding & Benefits (Simulated)
* **Tuition**: 100% covered by the scholarship program.
* **Stipend**: Monthly allowance of approximately €300 - €450 for living expenses.
* **Accommodation**: Double room in dormitories or a monthly housing subsidy.
* **Travel**: Relocation travel ticket reimbursement up to a certain limit.

#### 2. Key Deadlines (Simulated)
* **Admission Portal**: Closes mid-January.
* **Scholarship Application**: Submission deadline matches admission portal (15 January).

#### 3. Eligibility & Requirements for candidates from **${homeCountry}**
* **Previous Degree**: Requires **${highestDegree}** or equivalent.
* **Academic transcript**: Must be officially verified.
* **English Proficiency**: Candidates from ${homeCountry} may receive an IELTS waiver if their previous degree instruction medium was English (requires official letter from previous university).

#### 4. Official Links
* [University Portal](https://google.com/search?q=${encodeURIComponent(universityName)})
* [Scholarship Info](https://google.com/search?q=${encodeURIComponent(scholarshipName || universityName + " scholarship")})`;

    // Save mock summary to DB
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        ai_research_summary: mockSummary,
        ai_research_updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/pipeline");
    return { success: true };
  }

  // 5. Call Anthropic Messages API
  try {
    const prompt = `You are an expert academic advisor and scholarship researcher. 
Review and analyze options for the following program:
- Program: ${programName}
- University: ${universityName}
- Country: ${country}
- Scholarship: ${scholarshipName}

Candidate Profile:
- Home Country: ${homeCountry}
- Highest Degree: ${highestDegree}
- Years of Experience: ${yoe}

Below are recent web search results related to this program and scholarship:
---
${searchSnippets}
---

Based on the search results and your expert knowledge, provide a highly structured, concise, and professional summary in Markdown.

Include:
1. **Funding & Benefits**: Specify what is covered (tuition, monthly stipend, flights, health insurance, etc.) and what the candidate must pay out-of-pocket.
2. **Key Deadlines**: Identify the standard application timelines for both the university admission and the scholarship. Note if they are separate.
3. **Core Eligibility & Requirements**: List required items (transcripts, reference letters, language certs) and note any country-specific rules (e.g., if English test waivers apply to candidates from ${homeCountry}).
4. **Official Links**: Provide direct links to official program/scholarship portals for verification.

Guidelines:
- Keep the summary clear, bulleted, and actionable.
- If the search results indicate a scholarship is inactive, closed, or its rules have changed, highlight this at the top with a warning.
- Label any unverified details clearly. Do not make up facts.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text;

    if (!summary) {
      throw new Error("Empty response received from Anthropic Claude.");
    }

    // Save summary to database
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        ai_research_summary: summary,
        ai_research_updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      return { error: updateError.message };
    }

    revalidatePath("/pipeline");
    return { success: true };
  } catch (err) {
    console.error("Research Assist API error:", err);
    return { error: `AI Research Assist failed: ${(err as Error).message}` };
  }
}
