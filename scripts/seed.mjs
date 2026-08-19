/**
 * Seed script — run once against your Supabase project.
 * Usage: node scripts/seed.mjs
 *
 * Seeds:
 *  - 3 applications (Hungary, Poland, Germany) for the first user account
 *  - 3 requirement_templates (is_shared = true) visible to all users
 *
 * The script is idempotent: it checks before inserting and skips existing rows.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency)
// ---------------------------------------------------------------------------

function loadEnv() {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=");
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
      }),
  );
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const testEmail = env.Test_mail;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!testEmail) {
  console.error("Missing Test_mail in .env.local — needed to identify the seed user");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Resolve the seed user's ID from their email via the admin auth API
// ---------------------------------------------------------------------------

console.log(`Looking up user: ${testEmail}`);

const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error(`Failed to list users: ${listError.message}`);
  process.exit(1);
}

const seedUser = usersPage?.users?.find(
  (u) => u.email?.toLowerCase() === testEmail.toLowerCase(),
);

if (!seedUser) {
  console.error(
    `User "${testEmail}" not found in auth.users. ` +
    `Make sure they have signed in at least once (to trigger profile creation via the callback route) ` +
    `before running this seed script.`,
  );
  process.exit(1);
}

const userId = seedUser.id;
console.log(`Found user: ${userId}`);

// ---------------------------------------------------------------------------
// Seed applications
// ---------------------------------------------------------------------------

const applicationSeeds = [
  {
    user_id: userId,
    university_name: "Budapest University of Technology and Economics",
    country: "Hungary",
    program_name: "Computational Engineering / Industrial IoT",
    scholarship_name: "Stipendium Hungaricum",
    status: "Discovery",
    visa_required: true,
    deposit_required: 0,
  },
  {
    user_id: userId,
    university_name: "Warsaw University of Technology",
    country: "Poland",
    program_name: "Computer Science (MSc)",
    scholarship_name: null,
    status: "Discovery",
    visa_required: true,
    deposit_required: 0,
  },
  {
    user_id: userId,
    university_name: "Technical University of Munich",
    country: "Germany",
    program_name: "Informatics (MSc)",
    scholarship_name: null,
    status: "Discovery",
    visa_required: true,
    deposit_required: 0,
  },
];

// Check which applications already exist for this user
const { data: existingApps, error: appsReadError } = await supabase
  .from("applications")
  .select("country")
  .eq("user_id", userId);

if (appsReadError) {
  console.error(`Failed to read existing applications: ${appsReadError.message}`);
  process.exit(1);
}

const existingCountries = new Set((existingApps ?? []).map((a) => a.country));

const appsToInsert = applicationSeeds.filter(
  (app) => !existingCountries.has(app.country),
);

if (appsToInsert.length === 0) {
  console.log("Applications already seeded — skipping.");
} else {
  const { error: appsInsertError } = await supabase
    .from("applications")
    .insert(appsToInsert);

  if (appsInsertError) {
    console.error(`Failed to insert applications: ${appsInsertError.message}`);
    process.exit(1);
  }
  console.log(`Inserted ${appsToInsert.length} application(s).`);
}

// ---------------------------------------------------------------------------
// Seed requirement templates
// ---------------------------------------------------------------------------

const templateSeeds = [
  {
    name: "Stipendium Hungaricum Standard Checklist",
    country: "Hungary",
    created_by: userId,
    is_shared: true,
    items: [
      { label: "Online application form (Stipendium Hungaricum portal)", category: "Forms", default_due_offset_days: null },
      { label: "Europass CV with photo", category: "CV & Motivation", default_due_offset_days: -21 },
      { label: "Motivation letter", category: "CV & Motivation", default_due_offset_days: -21 },
      { label: "Certified translations of academic documents", category: "Translations", default_due_offset_days: -30 },
      { label: "Medical certificate (Stipendium Hungaricum form)", category: "Medical", default_due_offset_days: -14 },
      { label: "Language proficiency proof (IELTS / TOEFL / equivalent)", category: "Language", default_due_offset_days: -30 },
      { label: "Passport copy (valid throughout study period)", category: "Identity", default_due_offset_days: -30 },
    ],
  },
  {
    name: "Germany — Blocked Account & Visa",
    country: "Germany",
    created_by: userId,
    is_shared: true,
    items: [
      { label: "Sperrkonto deposit (€11,904 target — Fintiba / Deutsche Bank)", category: "Finance", default_due_offset_days: -60 },
      { label: "University admission letter", category: "Admission", default_due_offset_days: -45 },
      {
        label: "APS certificate (conditional — only if prior degree from China, Vietnam, India, Pakistan, Bangladesh, or Mongolia; waived on DAAD/official German scholarship)",
        category: "Verification",
        default_due_offset_days: -90,
      },
      { label: "Health insurance proof (German statutory or equivalent)", category: "Insurance", default_due_offset_days: -30 },
      { label: "Visa appointment booking (German embassy / consulate)", category: "Visa", default_due_offset_days: -45 },
    ],
  },
  {
    name: "Nigeria — Standard Document Prep",
    country: "Nigeria",
    created_by: userId,
    is_shared: true,
    items: [
      { label: "WAEC / NECO result verification (e-verification or physical)", category: "Academic Records", default_due_offset_days: -60 },
      { label: "University statement of result / provisional certificate", category: "Academic Records", default_due_offset_days: -45 },
      { label: "NYSC discharge certificate or exemption letter", category: "National Service", default_due_offset_days: -60 },
      { label: "Transcript evaluation (WES or destination-required equivalent)", category: "Transcript", default_due_offset_days: -90 },
      { label: "International passport validity check (≥6 months beyond travel date)", category: "Identity", default_due_offset_days: -30 },
    ],
  },
];

// Check which templates already exist (match by name)
const { data: existingTemplates, error: templatesReadError } = await supabase
  .from("requirement_templates")
  .select("name");

if (templatesReadError) {
  console.error(`Failed to read existing templates: ${templatesReadError.message}`);
  process.exit(1);
}

const existingTemplateNames = new Set((existingTemplates ?? []).map((t) => t.name));

const templatesToInsert = templateSeeds.filter(
  (t) => !existingTemplateNames.has(t.name),
);

if (templatesToInsert.length === 0) {
  console.log("Requirement templates already seeded — skipping.");
} else {
  const { error: templatesInsertError } = await supabase
    .from("requirement_templates")
    .insert(templatesToInsert);

  if (templatesInsertError) {
    console.error(`Failed to insert templates: ${templatesInsertError.message}`);
    process.exit(1);
  }
  console.log(`Inserted ${templatesToInsert.length} requirement template(s).`);
}

console.log("Seed complete.");
