# Agent Brief — Application OS

Read this whole file before writing any code. It is the single source of truth for this project. The full detailed spec is `application-os-build-spec-v3.md` in this folder — **read that in full before starting**; this brief summarizes it and adds working conventions.

## 0. Starting state (confirm before doing anything)

- Supabase project exists but is **empty** — no tables yet. Run the full schema SQL from spec §1 once, in order, top to bottom.
- Next.js app is scaffolded but has **no custom code yet** — this is a true fresh start, not a migration. Don't write migration/diff logic; just build.
- Confirm `.env.local` is set up with: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `ANTHROPIC_API_KEY` (for Research Assist), `RESEND_API_KEY` (for the deadline digest). If any are missing, ask before proceeding rather than stubbing them out.
- Create the private Supabase Storage bucket `document_vault` before writing any upload code — confirm it's private, not public.

## 1. What this project is

A personal (soon 2–3 person) tool to track international university/scholarship applications, required documents, and remaining capital — from the point a program is worth tracking through to acceptance/rejection — with a lightweight AI-assisted research pass for programs still being weighed. Full details: `application-os-build-spec-v3.md`.

## 2. Non-negotiable constraints

- **TypeScript strict mode. No `any`.** Use `unknown` or explicit interfaces.
- **Tailwind v3 utility classes only.**
- **All DB writes go through Server Actions**, never direct client-side Supabase mutation calls. Reads can be Server or Client Components as appropriate.
- **Every table needs RLS with both `USING` and `WITH CHECK`** — the exact pattern is in spec §1. Don't invent new policy patterns.
- **Auth is closed/invite-only.** Public signup must stay disabled in Supabase Auth settings. Do not build a public signup flow.
- **No admin UI.** `profiles.role` exists for future use only.
- **FX conversion:** `frankfurter.app` (free, no key) for USD/EUR/HUF/PLN and similar major currencies. It does **not** support NGN — use a second free keyless API (e.g. `open.er-api.com`) specifically for the `amount_ngn` shadow value on ledger entries. If either fetch fails, let the user manually enter the converted amount — never block ledger entry on a network call.
- **Email:** Resend (free tier), daily digest only — don't add other email features unless asked.
- **Research Assist (Anthropic API):** server-side only, never expose `ANTHROPIC_API_KEY` to the client. Use web search in the API call so results reflect current information, not training-data-only. Store the result in `ai_research_summary` / `ai_research_updated_at` on the application row. In the UI, label this clearly as an AI-generated first pass to verify — never let it silently overwrite the user's own `research_notes`.

## 3. Build order (do not reorder without asking)

**Phase 0 setup → Phase 1 Auth/Profile → Phase 2 Ledger & Capital → Phase 3 Requirements (incl. template builder) → Phase 4 Pipeline/Kanban + Research Assist → Phase 5 Document Vault → Phase 6 Deadlines/Resend digest/polish.**

Ledger comes right after Auth — that's the actual pain point today, and it should be usable standalone before the rest of the app exists. After each phase, stop, report what was built, and what to test manually before moving to the next phase. Don't build all 6 phases in one pass.

## 4. Schema

Run the full `CREATE TABLE` schema from spec §1 exactly once, top to bottom, against the empty Supabase project. It includes:
- The 6 tables (`profiles`, `applications`, `requirement_templates`, `application_requirements`, `ledger`, `documents`).
- `applications.status` includes `'Pathway Idea'` as the first Kanban column, plus `research_notes`, `link_url`, `ai_research_summary`, `ai_research_updated_at`.
- `ledger` includes `amount_ngn`, `funding_source`, and `expense_type` with `'agent_fee'` as its own category.
- RLS with `USING` + `WITH CHECK` on every policy, and storage RLS for `document_vault` using the `{user_id}/filename` folder convention.

Do not modify the capital calculation logic (liquid vs. locked capital, spec §0 Module 6) or the RLS pattern without flagging the change first — both were deliberate decisions.

## 5. Seed data

Seed **only against the first user account created (me)**:
- 3 `applications` rows: Hungary, Poland, Germany — status `Discovery`.
- 3 `requirement_templates` rows, `is_shared = true`: Stipendium Hungaricum, Germany Blocked Account & Visa, Nigeria Standard Document Prep — item lists in spec §2.

Other pilot users added later should see an empty Pipeline/Requirements state, not this seed data.

## 6. Open items to confirm with me before building (don't guess)

- Whether Shadcn UI is already initialized in the scaffolded app, or needs `npx shadcn-ui@latest init` first.
- Whether `@dnd-kit/core` is already a dependency, or needs adding.
- Exact prompt wording for the Research Assist Anthropic API call — draft one based on spec §0 Module 3 and show it to me before wiring it up, since this is the one feature with an ongoing cost and I want to see the prompt before it's live.

If anything in the spec is ambiguous, ask rather than assuming — this is a small, controlled build and a wrong assumption costs more time than a question does.