"use client";

import { useTransition, useState } from "react";
import {
  FileText,
  Calendar,
  AlertTriangle,
  Download,
  Trash2,
  AlertCircle,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import { deleteDocument, getSignedUrlAction } from "@/app/actions/documents";
import type { Document, DocumentType, Application, ApplicationRequirement } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useToast } from "@/components/ui/toast";

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  passport: "Passport",
  transcript: "Academic Transcript",
  degree_certificate: "Degree Certificate",
  motivation_letter: "Motivation Letter",
  recommendation_letter: "Recommendation Letter",
  language_cert: "Language Cert (IELTS/etc.)",
  medical_cert: "Medical Certificate",
  translation: "Certified Translation",
  other: "Other Document",
};

interface DocumentListProps {
  documents: Document[];
  applications: Application[];
  requirements: ApplicationRequirement[];
}

export function DocumentList({ documents, applications, requirements }: DocumentListProps) {
  const [isPending, startTransition] = useTransition();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; path: string; name: string } | null>(null);
  const { toast } = useToast();

  const confirmDeleteDocument = async () => {
    if (!deletingDoc) return;
    const { id, path, name } = deletingDoc;
    setDeletingDoc(null);

    startTransition(async () => {
      await deleteDocument(id, path);
      toast({
        title: "Document deleted",
        description: `"${name}" removed from vault. Linked checklist items unlinked.`,
        type: "info",
      });
    });
  };

  const handleDownload = async (id: string, path: string) => {
    setDownloadingId(id);
    try {
      const url = await getSignedUrlAction(path);
      if (url) {
        window.open(url, "_blank");
      } else {
        toast({ title: "Download failed", description: "Could not retrieve secure download link.", type: "error" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Download failed", description: "Failed to download document.", type: "error" });
    } finally {
      setDownloadingId(null);
    }
  };

  // Helper to determine expiry status
  const getExpiryStatus = (expiryStr: string | null) => {
    if (!expiryStr) return null;
    const expiry = new Date(expiryStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `Expired (${Math.abs(diffDays)} days ago)`,
        variant: "expired" as const,
        className: "bg-red-500/10 text-red-500 border-red-500/20",
      };
    }
    if (diffDays <= 90) {
      return {
        label: `Expiring in ${diffDays} days`,
        variant: "warning" as const,
        className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      };
    }
    return {
      label: `Expires ${expiry.toLocaleDateString()}`,
      variant: "ok" as const,
      className: "bg-muted text-muted-foreground border-border",
    };
  };

  // Helper to find links
  const getLinkedInfo = (docId: string) => {
    const linkedReq = requirements.find((r) => r.document_id === docId);
    if (!linkedReq) return null;
    const linkedApp = applications.find((a) => a.id === linkedReq.application_id);
    return {
      app: linkedApp,
      req: linkedReq,
    };
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--border)" }}>
        <FileText className="h-10 w-10 text-muted-foreground opacity-30 mb-3" />
        <h3 className="text-sm font-semibold">Vault is empty</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          No files uploaded yet. Add passports, transcripts, and language certificates above.
        </p>
      </div>
    );
  }

  // Count items with warnings for the banner
  const soonExpiredDocs = documents.filter((doc) => {
    const status = getExpiryStatus(doc.expiry_date);
    return status?.variant === "warning" || status?.variant === "expired";
  });

  return (
    <>
      <div className="space-y-6">
        {/* Warning banner if documents are expiring soon */}
        {soonExpiredDocs.length > 0 && (
          <div className="flex gap-3 bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-xs text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <span className="font-semibold block uppercase">Action Required: Expiry Alert</span>
              <p className="leading-relaxed">
                You have {soonExpiredDocs.length} document(s) in your vault that are already expired or expiring within 90 days. 
                Ensure you prepare renewals for items like passports or IELTS certificates before they impact your applications.
              </p>
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => {
            const expiryStatus = getExpiryStatus(doc.expiry_date);
            const linkInfo = getLinkedInfo(doc.id);
            const isDownloading = downloadingId === doc.id;

            return (
              <div
                key={doc.id}
                className="rounded-xl border bg-card/40 p-4.5 flex flex-col justify-between space-y-4 hover:border-primary/45 transition-colors relative"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Type & Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {DOCUMENT_LABELS[doc.document_type || "other"]}
                    </span>

                    {expiryStatus && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${expiryStatus.className}`}>
                        {expiryStatus.label}
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm truncate text-foreground flex items-center gap-1.5" title={doc.file_name}>
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{doc.file_name}</span>
                  </h4>
                </div>

                {/* Linked Task Details */}
                {linkInfo && (
                  <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/15 flex items-start gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="text-[11px] text-muted-foreground leading-snug">
                      <span className="font-medium text-foreground block truncate">
                        {linkInfo.req.label}
                      </span>
                      <span className="truncate block opacity-75">
                        {linkInfo.app?.university_name}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t gap-2" style={{ borderColor: "var(--border)" }}>
                  <Button
                    onClick={() => handleDownload(doc.id, doc.storage_url)}
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                    className="h-8 text-xs flex gap-1.5 items-center flex-1"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                    ) : (
                      <Download className="h-3 w-3 shrink-0" />
                    )}
                    {isDownloading ? "Retrieving..." : "Download"}
                  </Button>
                  <Button
                    onClick={() => setDeletingDoc({ id: doc.id, path: doc.storage_url, name: doc.file_name })}
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        onConfirm={confirmDeleteDocument}
        title={deletingDoc ? `Delete "${deletingDoc.name}"?` : "Delete Document?"}
        description="Are you sure you want to delete this document from your vault? Linked checklist items will be unlinked."
        confirmText="Yes, Delete Document"
        isPending={isPending}
      />
    </>
  );
}
