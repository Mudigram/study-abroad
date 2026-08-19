"use client";

import { useState, useTransition, useMemo } from "react";
import { Upload, File, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createDocumentEntry } from "@/app/actions/documents";
import type { Application, ApplicationRequirement, DocumentType } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "passport", label: "Passport" },
  { value: "transcript", label: "Academic Transcript" },
  { value: "degree_certificate", label: "Degree Certificate" },
  { value: "motivation_letter", label: "Motivation Letter" },
  { value: "recommendation_letter", label: "Recommendation Letter" },
  { value: "language_cert", label: "Language Proficiency Certificate" },
  { value: "medical_cert", label: "Medical Certificate" },
  { value: "translation", label: "Certified Translation" },
  { value: "other", label: "Other" },
];

interface UploadZoneProps {
  userId: string;
  applications: Application[];
  requirements: ApplicationRequirement[];
  onSuccess: () => void;
}

export function UploadZone({ userId, applications, requirements, onSuccess }: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("passport");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedReqId, setSelectedReqId] = useState("");

  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  // Filter requirements for the selected application that do not have a linked document
  const filteredRequirements = useMemo(() => {
    if (!selectedAppId) return [];
    return requirements.filter(
      (r) => r.application_id === selectedAppId && !r.document_id,
    );
  }, [requirements, selectedAppId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      
      // Clean up filename (replace spaces/special chars)
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      // Path convention: {user_id}/filename
      const storagePath = `${userId}/${Date.now()}_${cleanFileName}`;

      // Upload file directly to Supabase storage to bypass Vercel server limit
      const { data, error: uploadError } = await supabase.storage
        .from("document_vault")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          type: "error",
        });
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const storageUrl = data.path;

      // Call server action to update DB
      startTransition(async () => {
        const res = await createDocumentEntry(
          file.name,
          storageUrl,
          docType,
          expiryDate ? expiryDate : null,
          selectedAppId ? selectedAppId : null,
          selectedReqId ? selectedReqId : null,
        );

        setUploading(false);
        if (res.error) {
          setError(res.error);
          toast({
            title: "Upload failed",
            description: res.error,
            type: "error",
          });
        } else {
          setSuccess(`Successfully uploaded "${file.name}" to vault.`);
          toast({
            title: "Document uploaded!",
            description: `"${file.name}" saved successfully.`,
            type: "success",
          });
          setFile(null);
          setExpiryDate("");
          setSelectedAppId("");
          setSelectedReqId("");
          onSuccess();
        }
      });
    } catch (err) {
      setUploading(false);
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      {/* Drop Zone Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("vault-file-input")?.click()}
        className="border-2 border-dashed border-border hover:border-primary/50 bg-card/20 rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center space-y-2 group"
      >
        <input
          id="vault-file-input"
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
        {file ? (
          <>
            <File className="h-10 w-10 text-primary shrink-0" />
            <span className="text-sm font-semibold truncate max-w-xs">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change file
            </span>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            <span className="text-sm font-medium text-foreground">
              Drag &amp; drop document or click to browse
            </span>
            <span className="text-xs text-muted-foreground">
              PDF, PNG, JPG, or DOCX formats
            </span>
          </>
        )}
      </div>

      {file && (
        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Document Type */}
            <div className="grid gap-1.5">
              <Label htmlFor="doc_type">Document Type</Label>
              <CustomSelect
                id="doc_type"
                value={docType}
                onChange={(val) => setDocType(val as DocumentType)}
                options={DOCUMENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>

            {/* Expiry Date */}
            <div className="grid gap-1.5">
              <Label htmlFor="doc_expiry">Expiry Date (If applicable)</Label>
              <Input
                id="doc_expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Optional Application Link */}
            <div className="grid gap-1.5">
              <Label htmlFor="doc_app_link">Link to Application (Optional)</Label>
              <CustomSelect
                id="doc_app_link"
                value={selectedAppId}
                onChange={(val) => {
                  setSelectedAppId(val);
                  setSelectedReqId("");
                }}
                options={[
                  { value: "", label: "Do not link to app" },
                  ...applications.map((app) => ({
                    value: app.id,
                    label: `${app.university_name} (${app.country})`,
                  })),
                ]}
              />
            </div>

            {/* Optional Requirement Link */}
            {selectedAppId && (
              <div className="grid gap-1.5">
                <Label htmlFor="doc_req_link">Checklist Item to Auto-complete</Label>
                <CustomSelect
                  id="doc_req_link"
                  value={selectedReqId}
                  onChange={setSelectedReqId}
                  options={[
                    { value: "", label: "Select task to complete" },
                    ...filteredRequirements.map((req) => ({
                      value: req.id,
                      label: `${req.label} (${req.category || "General"})`,
                    })),
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2 items-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex gap-2 items-center text-sm text-primary bg-primary/10 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {file && (
        <Button
          type="submit"
          className="w-full flex justify-center items-center gap-1.5"
          disabled={uploading || isPending}
        >
          {(uploading || isPending) && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
          {uploading ? "Uploading file..." : isPending ? "Registering document..." : "Upload Document"}
        </Button>
      )}
    </form>
  );
}
