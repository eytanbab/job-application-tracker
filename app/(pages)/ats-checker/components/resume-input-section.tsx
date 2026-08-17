"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  AlignLeft,
  CheckCircle2,
  X,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import type { ResumeInputPayload } from "@/app/actions/ats";

type SavedDocument = {
  id: string;
  title: string;
  fileName: string;
  fileSize: string | null;
  category: string;
  createdAt: Date;
};

interface ResumeInputSectionProps {
  savedDocuments: SavedDocument[];
  value: ResumeInputPayload;
  onChange: (payload: ResumeInputPayload) => void;
  disabled?: boolean;
}

export function ResumeInputSection({
  savedDocuments,
  value,
  onChange,
  disabled = false,
}: ResumeInputSectionProps) {
  const [activeTab, setActiveTab] = useState<"document" | "upload" | "text">(
    value.type === "document"
      ? "document"
      : value.type === "file"
        ? "upload"
        : value.type === "text" && value.text
          ? "text"
          : savedDocuments.length > 0
            ? "document"
            : "upload",
  );

  // Independent internal draft states to prevent data loss on tab switches
  const [savedDocId, setSavedDocId] = useState<string>(
    value.type === "document" ? value.documentId : savedDocuments[0]?.id || "",
  );
  const [uploadedFile, setUploadedFile] = useState<{
    base64: string;
    mimeType: string;
    fileName: string;
  }>(
    value.type === "file"
      ? {
          base64: value.base64,
          mimeType: value.mimeType,
          fileName: value.fileName,
        }
      : { base64: "", mimeType: "application/pdf", fileName: "" },
  );
  const [pastedText, setPastedText] = useState<string>(
    value.type === "text" ? value.text : "",
  );

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;

    // 1. Validate file format (PDF strictly required for native parsing)
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast({
        title: "Unsupported file format",
        description: "Please upload a PDF document (.pdf) for ATS evaluation.",
        variant: "destructive",
      });
      return;
    }

    // 2. Validate file size (Max 10MB)
    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast({
        title: "File too large",
        description: "Resume PDF must be under 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      const payload = {
        base64,
        mimeType: "application/pdf",
        fileName: file.name,
      };
      setUploadedFile(payload);
      onChange({
        type: "file",
        ...payload,
      });
      toast({
        title: "Resume uploaded",
        description: `${file.name} is ready for ATS analysis.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Failed to read the uploaded file. Please try again.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleTabSwitch = (tab: "document" | "upload" | "text") => {
    if (disabled) return;
    setActiveTab(tab);
    if (tab === "document") {
      onChange({
        type: "document",
        documentId: savedDocId || savedDocuments[0]?.id || "",
      });
    } else if (tab === "upload") {
      onChange({
        type: "file",
        ...uploadedFile,
      });
    } else if (tab === "text") {
      onChange({
        type: "text",
        text: pastedText,
      });
    }
  };

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
                1. Provide Your Resume
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {savedDocuments.length > 0
                ? "Select a stored document, upload a new PDF, or paste text"
                : "Upload a PDF resume or paste plain text"}
            </CardDescription>
          </div>

          {/* Mode Switcher Group */}
          <div
            role="group"
            aria-label="Resume input mode"
            className="inline-flex items-center rounded-lg bg-muted/60 p-1 gap-1 border border-border/20 self-start sm:self-auto"
          >
            {savedDocuments.length > 0 && (
              <button
                type="button"
                disabled={disabled}
                aria-pressed={activeTab === "document"}
                onClick={() => handleTabSwitch("document")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                  activeTab === "document"
                    ? "bg-background text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Saved ({savedDocuments.length})</span>
              </button>
            )}

            <button
              type="button"
              disabled={disabled}
              aria-pressed={activeTab === "upload"}
              onClick={() => handleTabSwitch("upload")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                activeTab === "upload"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload PDF</span>
            </button>

            <button
              type="button"
              disabled={disabled}
              aria-pressed={activeTab === "text"}
              onClick={() => handleTabSwitch("text")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                activeTab === "text"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AlignLeft className="h-3.5 w-3.5" />
              <span>Paste Text</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-1 flex flex-col justify-center min-h-[220px]">
        {/* 1. Saved S3 Document Selector */}
        {activeTab === "document" && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground">
              Select Resume from Documents Library
            </label>
            <Select
              disabled={disabled}
              value={savedDocId}
              onValueChange={(docId) => {
                setSavedDocId(docId);
                onChange({ type: "document", documentId: docId });
              }}
            >
              <SelectTrigger className="w-full h-10 text-xs cursor-pointer">
                <SelectValue placeholder="Choose a saved resume" />
              </SelectTrigger>
              <SelectContent>
                {savedDocuments.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{doc.title}</span>
                      <span className="text-muted-foreground text-[11px]">
                        ({doc.fileName}{" "}
                        {doc.fileSize ? `• ${doc.fileSize}` : ""})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-lg bg-muted/40 p-3 border border-border/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-foreground/90 font-medium">
                  Document loaded directly from secure cloud storage
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold"
              >
                Cloud Synced
              </Badge>
            </div>
          </div>
        )}

        {/* 2. File Upload Dropzone */}
        {activeTab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              disabled={disabled}
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadedFile.base64 && uploadedFile.fileName ? (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-4 flex items-center justify-between min-h-[160px]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-sm">
                      {uploadedFile.fileName}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Ready for ATS evaluation
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => {
                    const emptyPayload = {
                      base64: "",
                      mimeType: "application/pdf",
                      fileName: "",
                    };
                    setUploadedFile(emptyPayload);
                    onChange({ type: "file", ...emptyPayload });
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
                  aria-label="Remove uploaded file"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!disabled) setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => {
                  if (!disabled) fileInputRef.current?.click();
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors text-center min-h-[160px]",
                  disabled
                    ? "opacity-50 cursor-not-allowed border-border/40 bg-muted/10"
                    : dragOver
                      ? "border-primary bg-primary/5 cursor-pointer"
                      : "border-border/60 hover:border-primary/40 hover:bg-muted/30 cursor-pointer",
                )}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  Click to upload or drag & drop resume
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PDF format only (Max 10MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. Plain Textarea Paste */}
        {activeTab === "text" && (
          <div className="space-y-2">
            <Textarea
              disabled={disabled}
              placeholder="Paste your plain resume text here (Summary, Work Experience, Skills, Education)..."
              value={pastedText}
              onChange={(e) => {
                const txt = e.target.value;
                setPastedText(txt);
                onChange({ type: "text", text: txt });
              }}
              className="min-h-[160px] text-xs resize-y"
            />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Plain text format</span>
              <span>{pastedText.length} characters</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
