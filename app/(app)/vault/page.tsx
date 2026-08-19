import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocuments, getAllUserRequirements } from "@/app/actions/documents";
import { getApplications } from "@/app/actions/applications";
import { UploadZone } from "@/components/vault/upload-zone";
import { DocumentList } from "@/components/vault/document-list";
import type { ApplicationRequirement } from "@/lib/types/database";

export default async function VaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [documents, applications, rawRequirements] = await Promise.all([
    getDocuments(),
    getApplications(),
    getAllUserRequirements(),
  ]);

  const requirements = (rawRequirements ?? []) as ApplicationRequirement[];

  return (
    <div className="flex w-full flex-col gap-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-sans">Document Vault</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Store your academic records, passports, and certs securely. Link files to checklist items.
        </p>
      </div>

      {/* Upload Zone Card */}
      <div className="bg-card rounded-xl border p-5" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-semibold mb-3">Upload Document</h2>
        <UploadZone
          userId={user.id}
          applications={applications}
          requirements={requirements}
          // Server-side path revalidation automatically triggers list update on client
          onSuccess={async () => {
            "use server";
          }}
        />
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Vault Documents</h2>
        <DocumentList
          documents={documents}
          applications={applications}
          requirements={requirements}
        />
      </div>
    </div>
  );
}
