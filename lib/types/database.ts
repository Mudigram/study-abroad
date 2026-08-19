export type ProfileRole = "owner" | "member";

export interface Profile {
  id: string;
  full_name: string | null;
  total_budget: number;
  base_currency: string;
  highest_degree: string | null;
  yoe: number;
  home_country: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

export interface RequirementTemplateItem {
  label: string;
  category: string;
  default_due_offset_days: number | null;
}

export interface RequirementTemplate {
  id: string;
  name: string;
  country: string | null;
  items: RequirementTemplateItem[];
  created_by: string | null;
  is_shared: boolean;
  created_at: string;
}

export type ApplicationStatus =
  | "Pathway Idea"
  | "Discovery"
  | "Preparing Docs"
  | "Submitted"
  | "Interview"
  | "Accepted"
  | "Rejected";

export interface Application {
  id: string;
  user_id: string;
  university_name: string;
  country: string;
  program_name: string;
  scholarship_name: string | null;
  status: ApplicationStatus;
  priority: 1 | 2 | null;
  deadline: string | null;
  visa_required: boolean;
  deposit_required: number;
  notes: string | null;
  research_notes: string | null;
  link_url: string | null;
  ai_research_summary: string | null;
  ai_research_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseType =
  | "application_fee"
  | "translation"
  | "exam_fee"
  | "visa_fee"
  | "blocked_account"
  | "flight"
  | "agent_fee"
  | "other";

export type FundingSource =
  | "personal_savings"
  | "family_support"
  | "loan"
  | "scholarship_disbursement"
  | "other";

export interface LedgerEntry {
  id: string;
  user_id: string;
  application_id: string | null;
  amount_original: number;
  currency: string;
  amount_usd: number;
  amount_ngn: number | null;
  funding_source: FundingSource | null;
  expense_type: ExpenseType;
  description: string | null;
  created_at: string;
}

export type DocumentType =
  | "passport"
  | "transcript"
  | "degree_certificate"
  | "motivation_letter"
  | "recommendation_letter"
  | "language_cert"
  | "medical_cert"
  | "translation"
  | "other";

export interface Document {
  id: string;
  user_id: string;
  application_id: string | null;
  document_type: DocumentType | null;
  file_name: string;
  storage_url: string;
  expiry_date: string | null;
  created_at: string;
}

export type RequirementStatus = "Not Started" | "In Progress" | "Done";

export interface ApplicationRequirement {
  id: string;
  application_id: string;
  user_id: string;
  label: string;
  category: string | null;
  status: RequirementStatus;
  due_date: string | null;
  document_id: string | null;
  created_at: string;
}

