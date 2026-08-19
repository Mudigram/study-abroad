# Application OS — Build Spec v3 (Fresh Start, Pilot Edition)
Target: fully working personal tool, usable by you immediately, extendable to 2–3 pilot testers. Both the Supabase project and the Next.js app are being rebuilt from a clean slate, so this spec is self-contained — no migration diffing needed.

---

## 0. Core Architecture (6 Modules)

### Module 1 — Global Profile
- Total budget + `base_currency` (default USD).
- Target degree, YOE, `home_country`.

### Module 2 — The Pipeline (Kanban)
- Columns: **Pathway Idea** → Discovery → Preparing Docs → Submitted → Interview → Accepted → Rejected.
- `scholarship_name`, `priority` (1/2, since Stipendium Hungaricum caps you at 2 ranked choices), `visa_required`, `deadline`.
- Deadline coloring: red ≤14 days, amber ≤30 days.
- `research_notes` (free text) and `link_url` on every card — a scratchpad for what you find outside the app before a Pathway Idea is worth promoting to full Discovery tracking.

### Module 3 — Research Assist (NEW — Path B)
For any card in the **Pathway Idea** column, a "Research this" button triggers a server-side call to the Anthropic API (Claude, with web search enabled) with a prompt built from the card's field, country, and degree level — something like *"Find current scholarship/program options for [program] in [country] for a candidate with [degree background]; summarize funding, deadlines, and requirements."* The response is stored as `ai_research_summary` + `ai_research_updated_at` and shown in the card.

**Important framing for the UI:** label this clearly as a first-pass AI summary to verify, not a source of truth — link out to search results where possible, and never let it silently overwrite your own `research_notes`.

This is the one part of the stack with a real, ongoing (if small) cost — everything else runs on free tiers.

### Module 4 — Requirements Checklist
- `requirement_templates`: reusable checklists per scholarship/country, `is_shared` (visible to everyone) or `created_by` (private to one user).
- `application_requirements`: instantiated per application, `status` (Not Started/In Progress/Done), `due_date`, optional link to a Document Vault row.
- In-app **Custom Requirement Template Builder** — repeatable `{label, category, due_offset_days}` rows — so a pilot tester whose country isn't pre-seeded isn't stuck.
- Seeded templates (yours, `is_shared = true`):
  1. **Stipendium Hungaricum Standard Checklist** — application form, Europass CV + photo, motivation letter, certified translations, medical certificate, language proficiency proof, passport copy; deadline offset 15 January.
  2. **Germany — Blocked Account & Visa** — Sperrkonto (€11,904 target), admission letter, APS certificate (conditional — see note below), health insurance proof, visa appointment.
  3. **Nigeria — Standard Document Prep** — WAEC/NECO result verification, university statement of result, NYSC certificate or exemption letter, transcript evaluation (WES or destination-required equivalent), international passport validity check.

  *APS note: only required if your prior degree was earned in China, Vietnam, India, Pakistan, Bangladesh, or Mongolia, and waived if on a DAAD/official German scholarship — mark this item conditional/optional in the UI, don't assume it applies.*

### Module 5 — The Document Vault
- `document_type` enum, `expiry_date` (surfaces a warning banner within 90 days — relevant for passports and IELTS, which is valid 2 years).
- Optional link to `application_requirements.id`, auto-marking a checklist item Done on upload.

### Module 6 — The Financial Ledger
**Capital logic** (unchanged from prior decision — this is the core fix over a naive single-sum ledger):
```
Remaining Liquid Capital = Total Capital
                          − SUM(ledger.amount_usd WHERE expense_type != 'blocked_account')
                          − SUM(blocked account deposits not yet released)

Total Committed (locked, not lost) = SUM(ledger.amount_usd WHERE expense_type = 'blocked_account')
```
- `currency` + `amount_original` + `amount_usd`, converted via **frankfurter.app** (free, no key, covers USD/EUR/HUF/PLN — confirmed via ECB's ~31 supported currencies).
- **NGN shadow amount:** `amount_ngn`, converted via a second free keyless API (`open.er-api.com` or similar — frankfurter does **not** cover NGN, confirmed). Shown alongside every entry, since sourcing/moving Naira is the actual practical constraint, not just the USD/EUR number.
- `expense_type` enum: `application_fee`, `translation`, `exam_fee`, `visa_fee`, `blocked_account`, `flight`, `agent_fee`, `other`. (`agent_fee` split out from `other` specifically so payments to consultants/agents have a clean, separately reviewable trail — relevant given how common scholarship/agent scams targeting Nigerian applicants are.)
- `funding_source` enum: `personal_savings`, `family_support`, `loan`, `scholarship_disbursement`, `other` — lets the dashboard eventually show how much of your remaining capital is actually secured vs. pledged.
- If any FX fetch fails, let the user type the converted value manually — never block ledger entry on a third-party network call.

---

## 1. Full Database Schema (fresh — run once, in order)

```sql
-- 1. Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  total_budget NUMERIC DEFAULT 0,
  base_currency TEXT DEFAULT 'USD',
  highest_degree TEXT,
  yoe INTEGER DEFAULT 0,
  home_country TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner','member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Applications (Pipeline)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  university_name TEXT NOT NULL,
  country TEXT NOT NULL,
  program_name TEXT NOT NULL,
  scholarship_name TEXT,
  status TEXT DEFAULT 'Pathway Idea' CHECK (status IN
    ('Pathway Idea','Discovery','Preparing Docs','Submitted','Interview','Accepted','Rejected')),
  priority SMALLINT CHECK (priority IN (1,2)),
  deadline DATE,
  visa_required BOOLEAN DEFAULT TRUE,
  deposit_required NUMERIC DEFAULT 0,
  notes TEXT,
  research_notes TEXT,
  link_url TEXT,
  ai_research_summary TEXT,
  ai_research_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_deadline ON applications(deadline);

-- 3. Requirement Templates
CREATE TABLE requirement_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  items JSONB NOT NULL,             -- [{label, category, default_due_offset_days}]
  created_by UUID REFERENCES profiles(id),
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Application Requirements
CREATE TABLE application_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  label TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started','In Progress','Done')),
  due_date DATE,
  document_id UUID, -- FK added after documents table
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_app_req_application_id ON application_requirements(application_id);

-- 5. Ledger
CREATE TABLE ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  application_id UUID REFERENCES applications(id),
  amount_original NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC NOT NULL,
  amount_ngn NUMERIC,
  funding_source TEXT CHECK (funding_source IN
    ('personal_savings','family_support','loan','scholarship_disbursement','other')),
  expense_type TEXT NOT NULL CHECK (expense_type IN
    ('application_fee','translation','exam_fee','visa_fee','blocked_account','flight','agent_fee','other')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ledger_user_id ON ledger(user_id);

-- 6. Documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  application_id UUID REFERENCES applications(id),
  document_type TEXT CHECK (document_type IN
    ('passport','transcript','degree_certificate','motivation_letter',
     'recommendation_letter','language_cert','medical_cert','translation','other')),
  file_name TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE application_requirements
  ADD CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES documents(id);

-- Row Level Security — every policy split by operation with WITH CHECK
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "manage own applications" ON applications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manage own requirements" ON application_requirements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manage own ledger" ON ledger FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manage own documents" ON documents FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read shared or own templates" ON requirement_templates FOR SELECT
  USING (is_shared = true OR created_by = auth.uid());
CREATE POLICY "create own templates" ON requirement_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Storage: private bucket 'document_vault', path convention {user_id}/filename
CREATE POLICY "user reads own files" ON storage.objects FOR SELECT
  USING (bucket_id = 'document_vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user uploads own files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'document_vault' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user deletes own files" ON storage.objects FOR DELETE
  USING (bucket_id = 'document_vault' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 2. Seed Data (your account only — other pilot users start empty)

- 3 `applications` rows: Hungary (Computational Engineering/Industrial IoT), Poland, Germany — status `Discovery`.
- 3 `requirement_templates` rows, `is_shared = true`: Stipendium Hungaricum, Germany Blocked Account & Visa, Nigeria Standard Document Prep (item lists above).

---

## 3. Pilot-Scale Simplifications (2–3 users, unchanged)

- Supabase magic-link auth; **public signup disabled** — only pre-added emails.
- No admin UI; `profiles.role` reserved for future use.
- No org/team model — every row scoped to a single `user_id`.
- Free-tier ceilings: Supabase 500MB DB / 1GB storage / pauses after 1 week inactivity; Vercel free tier is plenty at this scale.

---

## 4. Execution Plan

**Phase 0 — Setup**
- Fresh Next.js 14 App Router + TypeScript strict + Tailwind v3 + Shadcn UI.
- Run the full schema SQL above in the fresh Supabase project.
- Create private storage bucket `document_vault`.
- `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`.

**Phase 1 — Auth & Profile**
- `@supabase/ssr` clients for Server/Client Components, Server Actions, middleware.
- Magic-link login; first-login Server Action creates the `profiles` row.
- Profile setup form; seed script for your 3 applications + 3 templates.

**Phase 2 — Ledger & Capital**
- Server Actions for CRUD; dual FX calls (frankfurter for USD/EUR/HUF/PLN, a second keyless API for NGN).
- Dashboard widget: Liquid Capital Available + Capital Locked, both shown.
- "Add Expense" modal: currency, funding source, expense type (incl. `agent_fee`), live FX + NGN preview.

**Phase 3 — Requirements Checklist**
- Template attach + Custom Template Builder UI.
- Checklist view per application with progress bar.

**Phase 4 — Pipeline (Kanban) & Research Assist**
- `@dnd-kit/core` for drag-and-drop; columns include **Pathway Idea** as the first column.
- Card detail view: `research_notes`, `link_url`, and the "Research this" button (Server Action → Anthropic API with web search → stores `ai_research_summary`).
- Deadline coloring (red ≤14 days, amber ≤30).

**Phase 5 — Document Vault**
- Upload dropzone → Storage under `{user_id}/{filename}` → `documents` row.
- Optional auto-link to `application_requirements`; expiry banner within 90 days.

**Phase 6 — Deadlines & Polish**
- "Next 7 Days" dashboard widget.
- Daily Supabase Edge Function (cron) → Resend digest email.
- Empty states, loading skeletons, mobile check.

---

## 5. Decisions Confirmed (running log)

1. FX: frankfurter.app for USD/EUR/HUF/PLN (no key, ECB rates).
2. NGN: a second free keyless API (e.g. `open.er-api.com`), since frankfurter doesn't cover NGN.
3. Email digest: Resend, free tier.
4. APS certificate: conditional item, not assumed — depends on home country of prior degree and scholarship type.
5. Research Assist: Anthropic API (Claude + web search), server-side only, labeled clearly as a first-pass summary to verify — the one component with a real (small) ongoing cost.
6. Access stays closed/invite-only for the 2–3 person pilot; multi-country flexibility is handled via the Custom Template Builder rather than pre-seeding every country.