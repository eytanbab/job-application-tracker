"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./application-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  X,
  Loader2,
  CheckCircle2,
  Paperclip,
  Plus,
  Eye,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  getResumes,
  generatePresignedUrl,
  createFile,
  getViewUrl,
  findExistingResume,
} from "@/app/actions/documents";
import { useToast } from "@/hooks/use-toast";

interface ResumeItem {
  id: string;
  title: string;
  file_name: string;
  file_size?: string | null;
}

interface ResumePickerProps {
  form: UseFormReturn<FormValues>;
  disabled?: boolean;
  onUploadingChange?: (isUploading: boolean) => void;
  onDocumentUploaded?: (docId: string) => void;
}

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export function ResumePicker({
  form,
  disabled,
  onUploadingChange,
  onDocumentUploaded,
}: ResumePickerProps) {
  const { toast } = useToast();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isUploading, startUploadTransition] = useTransition();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showUploadMode, setShowUploadMode] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [existingDuplicate, setExistingDuplicate] =
    useState<ResumeItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedResumeId = form.watch("resumeId");

  useEffect(() => {
    let isMounted = true;
    getResumes()
      .then((docs) => {
        if (!isMounted) return;
        setResumes(
          docs.map((d) => ({
            id: d.id,
            title: d.title,
            file_name: d.file_name,
            file_size: d.file_size,
          })),
        );
      })
      .catch((err) => {
        console.error("Failed to load resumes:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Only PDF documents are supported for resumes.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > FILE_SIZE_LIMIT) {
      toast({
        title: "File too large",
        description: "Resume PDF must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadFile(file);
    const cleanName = file.name
      .replace(/\.pdf$/i, "")
      .replace(/[_-]/g, " ")
      .trim();

    if (!uploadTitle.trim()) {
      setUploadTitle(cleanName);
    }

    // Check if user already has this exact resume in their library
    const lowerFileName = file.name.toLowerCase().trim();
    const existing = resumes.find(
      (r) =>
        r.file_name.toLowerCase().trim() === lowerFileName ||
        r.title.toLowerCase().trim() === cleanName.toLowerCase(),
    );
    if (existing) {
      setExistingDuplicate(existing);
    } else {
      findExistingResume(file.name)
        .then((match) => {
          if (match) {
            setExistingDuplicate({
              id: match.id,
              title: match.title,
              file_name: match.file_name,
              file_size: match.file_size,
            });
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    if (!uploadFile) {
      setExistingDuplicate(null);
      return;
    }
    const cleanName = uploadFile.name
      .replace(/\.pdf$/i, "")
      .replace(/[_-]/g, " ")
      .trim();
    const lowerFileName = uploadFile.name.toLowerCase().trim();
    const existing = resumes.find(
      (r) =>
        r.file_name.toLowerCase().trim() === lowerFileName ||
        r.title.toLowerCase().trim() === cleanName.toLowerCase(),
    );
    if (existing) {
      setExistingDuplicate(existing);
    }
  }, [uploadFile, resumes]);

  const handleUseExisting = (doc: ResumeItem) => {
    form.setValue("resumeId", doc.id, { shouldDirty: true });
    setShowUploadMode(false);
    setUploadFile(null);
    setUploadTitle("");
    setExistingDuplicate(null);
    toast({
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Attached existing copy of &quot;{doc.title}&quot;</span>
        </div>
      ),
    });
  };

  const handlePreviewSelectedResume = async () => {
    if (!selectedResume?.id) return;
    setIsPreviewing(true);
    try {
      const res = await getViewUrl(selectedResume.id);
      if (res.error || !res.url) {
        toast({
          title: "Preview unavailable",
          description:
            res.error || "Could not generate view URL for this resume.",
          variant: "destructive",
        });
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Preview error:", err);
      toast({
        title: "Preview error",
        description: "Could not open resume preview.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast({
        title: "File required",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    const titleToUse =
      uploadTitle.trim() || uploadFile.name.replace(/\.pdf$/i, "");
    const formattedSize = `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`;

    onUploadingChange?.(true);
    startUploadTransition(async () => {
      try {
        const { fileKey, signedUrl, error } = await generatePresignedUrl(
          uploadFile.name,
          uploadFile.type,
        );

        if (error || !fileKey) {
          toast({
            title: "Upload failed",
            description: error || "Could not generate upload URL.",
            variant: "destructive",
          });
          onUploadingChange?.(false);
          return;
        }

        // Upload to S3 (or mock)
        if (signedUrl && !signedUrl.includes("mock-s3-upload")) {
          const res = await fetch(signedUrl, {
            method: "PUT",
            body: uploadFile,
            headers: { "Content-Type": uploadFile.type },
          });

          if (!res.ok) {
            throw new Error("Failed to upload file to cloud storage.");
          }
        } else if (signedUrl?.includes("mock-s3-upload")) {
          // Simulate instant local mock upload
          await new Promise((r) => setTimeout(r, 150));
        }

        const fileUrl = signedUrl ? signedUrl.split("?")[0] : "";
        const createdDoc = await createFile(
          titleToUse,
          fileUrl,
          uploadFile.name,
          fileKey,
          "resume",
          formattedSize,
        );

        const newId = createdDoc?.id || fileKey;
        const newResumeItem: ResumeItem = {
          id: newId,
          title: titleToUse,
          file_name: uploadFile.name,
          file_size: formattedSize,
        };

        setResumes((prev) => [newResumeItem, ...prev]);
        form.setValue("resumeId", newId, { shouldDirty: true });
        onDocumentUploaded?.(newId);
        setShowUploadMode(false);
        setUploadFile(null);
        setUploadTitle("");
        setExistingDuplicate(null);

        toast({
          description: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Resume uploaded and attached!</span>
            </div>
          ),
        });
      } catch (err) {
        console.error("Resume upload error:", err);
        toast({
          title: "Upload error",
          description: "An unexpected error occurred while uploading resume.",
          variant: "destructive",
        });
      } finally {
        onUploadingChange?.(false);
      }
    });
  };

  return (
    <FormField
      control={form.control}
      name="resumeId"
      render={({ field }) => (
        <FormItem className="space-y-1.5 col-span-full">
          <div className="flex items-center justify-between">
            <FormLabel className="text-xs font-semibold flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-primary" />
              Applied Resume (Optional)
            </FormLabel>
            {!showUploadMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadMode(true)}
                disabled={disabled || isUploading}
                className="h-6 text-[11px] px-2 gap-1 text-primary hover:bg-primary/10 cursor-pointer font-medium"
              >
                <Plus className="h-3 w-3" />
                <span>Upload New PDF</span>
              </Button>
            )}
          </div>

          {/* Inline Upload Sub-Form */}
          {showUploadMode ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Upload className="h-3.5 w-3.5 text-primary" />
                  Upload New Resume PDF
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUploadMode(false);
                    setUploadFile(null);
                    setUploadTitle("");
                  }}
                  disabled={isUploading}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,.pdf"
                    data-testid="resume-file-input"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <div
                    tabIndex={0}
                    role="button"
                    aria-label="Click or press enter to select PDF resume"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    className="border border-dashed border-border/80 hover:border-primary/60 bg-background/50 rounded-md p-3 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-medium text-foreground">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate max-w-[240px]">
                          {uploadFile.name}
                        </span>
                        <span className="text-muted-foreground text-[11px]">
                          ({(uploadFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-4 w-4 mx-auto text-muted-foreground" />
                        <p className="text-xs font-medium text-muted-foreground">
                          Click to select PDF resume (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Intelligent Deduplication Detection Alert */}
                {existingDuplicate && (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-foreground space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-amber-900 dark:text-amber-200">
                          Resume already in your library
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          &quot;{existingDuplicate.title}&quot; ({existingDuplicate.file_name}) is already saved.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        onClick={() => handleUseExisting(existingDuplicate)}
                        className="h-6 text-[11px] px-2.5 font-semibold cursor-pointer"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Use Existing Copy (Recommended)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setExistingDuplicate(null)}
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Upload As New Copy
                      </Button>
                    </div>
                  </div>
                )}

                {uploadFile && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Document Title (in your library)
                    </label>
                    <Input
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="e.g. Senior Frontend Resume 2026"
                      className="h-8 text-xs bg-background"
                      disabled={isUploading}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUploadMode(false);
                    setUploadFile(null);
                    setUploadTitle("");
                    setExistingDuplicate(null);
                  }}
                  disabled={isUploading}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUploadSubmit}
                  disabled={!uploadFile || isUploading}
                  className="h-7 text-xs px-3 font-semibold cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Uploading...
                    </>
                  ) : (
                    "Upload & Attach"
                  )}
                </Button>
              </div>
            </div>
          ) : selectedResume ? (
            /* Selected Resume Preview Card */
            <div className="flex items-center justify-between rounded-md border border-border/80 bg-card p-2.5 hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {selectedResume.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                    <span className="truncate">{selectedResume.file_name}</span>
                    {selectedResume.file_size && (
                      <>
                        <span>•</span>
                        <span>{selectedResume.file_size}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePreviewSelectedResume}
                  disabled={disabled || isPreviewing}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Preview resume online"
                >
                  {isPreviewing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 mr-1" />
                  )}
                  <span>Preview</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => field.onChange(null)}
                  disabled={disabled}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Detach resume from this application"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  <span>Detach</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Select From Library Dropdown */
            <FormControl>
              <Select
                value={field.value || "none"}
                onValueChange={(val) => {
                  field.onChange(val === "none" ? null : val);
                }}
                disabled={disabled || isLoadingList}
              >
                <SelectTrigger className="h-9 text-xs w-full bg-background cursor-pointer">
                  <SelectValue
                    placeholder={
                      isLoadingList
                        ? "Loading resumes..."
                        : resumes.length === 0
                          ? "No resumes in library (Click Upload New)"
                          : "Select resume applied with..."
                    }
                  />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="none" className="text-muted-foreground">
                    None (No resume attached)
                  </SelectItem>
                  {resumes.map((doc) => (
                    <SelectItem
                      key={doc.id}
                      value={doc.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{doc.title}</span>
                        {doc.file_size && (
                          <span className="text-[11px] text-muted-foreground">
                            ({doc.file_size})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          )}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
