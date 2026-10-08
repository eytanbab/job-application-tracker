"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Upload,
  Plus,
  Check,
  Loader2,
  X,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import {
  getResumes,
  generatePresignedUrl,
  createFile,
  findExistingResume,
} from "@/app/actions/documents";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ResumeMeta {
  title: string;
  fileName: string;
  fileSize?: string | null;
}

interface AttachResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentResumeId?: string | null;
  onSelectResume: (resumeId: string, meta: ResumeMeta) => Promise<void>;
}

interface ResumeItem {
  id: string;
  title: string;
  file_name: string;
  file_size?: string | null;
}

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export function AttachResumeDialog({
  open,
  onOpenChange,
  currentResumeId,
  onSelectResume,
}: AttachResumeDialogProps) {
  const { toast } = useToast();
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentResumeId || null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload new mode
  const [showUploadMode, setShowUploadMode] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [existingDuplicate, setExistingDuplicate] =
    useState<ResumeItem | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedId(currentResumeId || null);
    setShowUploadMode(false);
    setUploadFile(null);
    setUploadTitle("");
    setExistingDuplicate(null);
    setIsLoadingList(true);

    getResumes()
      .then((docs) => {
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
        setIsLoadingList(false);
      });
  }, [open, currentResumeId]);

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

  const handleUseExisting = async (doc: ResumeItem) => {
    setIsSubmitting(true);
    try {
      await onSelectResume(doc.id, {
        title: doc.title,
        fileName: doc.file_name,
        fileSize: doc.file_size,
      });
      onOpenChange(false);
      toast({
        description: (
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>Attached existing resume from your library.</span>
          </div>
        ),
      });
    } catch (err) {
      console.error("Failed to attach existing resume:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadAndAttach = () => {
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
          return;
        }

        if (signedUrl && !signedUrl.includes("mock-s3-upload")) {
          const res = await fetch(signedUrl, {
            method: "PUT",
            body: uploadFile,
            headers: { "Content-Type": uploadFile.type },
          });

          if (!res.ok) {
            throw new Error("Failed to upload file to storage.");
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
        const meta: ResumeMeta = {
          title: titleToUse,
          fileName: uploadFile.name,
          fileSize: formattedSize,
        };

        await onSelectResume(newId, meta);
        onOpenChange(false);
      } catch (err) {
        console.error("Resume upload error:", err);
        toast({
          title: "Upload error",
          description: "An unexpected error occurred while uploading resume.",
          variant: "destructive",
        });
      }
    });
  };

  const handleConfirmSelect = async () => {
    if (!selectedId) return;
    const doc = resumes.find((r) => r.id === selectedId);
    if (!doc) return;

    setIsSubmitting(true);
    try {
      await onSelectResume(selectedId, {
        title: doc.title,
        fileName: doc.file_name,
        fileSize: doc.file_size,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to attach resume:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/30">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Attach Resume
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Select a saved resume from your library or upload a new PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Header Action: Upload Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {showUploadMode ? "Upload New Resume" : "Saved Resumes"}
            </span>
            {!showUploadMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadMode(true)}
                disabled={isSubmitting}
                className="h-7 text-xs px-2 gap-1 text-primary hover:bg-primary/10 cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload New PDF</span>
              </Button>
            )}
          </div>

          {/* Upload Sub-Form */}
          {showUploadMode ? (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 animate-in fade-in duration-150">
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

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="application/pdf,.pdf"
                  data-testid="attach-resume-file-input"
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
                  className="border border-dashed border-border/80 hover:border-primary/60 bg-background/50 rounded-xl p-4 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-foreground">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate max-w-[220px]">
                        {uploadFile.name}
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({(uploadFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Click to select PDF resume (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Intelligent Deduplication Detection Alert */}
              {existingDuplicate && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground space-y-2 animate-in fade-in duration-150">
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
                      className="h-7 text-xs px-2.5 font-semibold cursor-pointer rounded-lg shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Use Existing Copy (Recommended)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setExistingDuplicate(null)}
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
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
                  className="h-8 text-xs px-2.5 cursor-pointer rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUploadAndAttach}
                  disabled={!uploadFile || isUploading}
                  className="h-8 text-xs px-3 font-semibold cursor-pointer rounded-lg shadow-xs"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Uploading & Attaching...
                    </>
                  ) : (
                    "Upload & Attach"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Saved Resumes List */
            <div className="space-y-2">
              {isLoadingList ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Loading your resumes...</span>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 space-y-2">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    No resumes found in your library.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUploadMode(true)}
                    className="h-7 text-xs cursor-pointer"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Upload Your First Resume
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {resumes.map((doc) => {
                    const isSelected = selectedId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`Select resume ${doc.title}`}
                        onClick={() => setSelectedId(doc.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(doc.id);
                          }
                        }}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isSelected
                            ? "border-primary bg-primary/10 shadow-2xs text-foreground"
                            : "border-border/60 bg-card hover:border-primary/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold truncate text-foreground">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                              <span className="truncate">{doc.file_name}</span>
                              {doc.file_size && (
                                <>
                                  <span>•</span>
                                  <span>{doc.file_size}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {!showUploadMode && (
          <DialogFooter className="px-5 py-3 border-t border-border/30 bg-muted/10 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs cursor-pointer rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmSelect}
              disabled={!selectedId || isSubmitting || isLoadingList}
              className="h-8 text-xs font-semibold cursor-pointer rounded-lg shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Attaching...
                </>
              ) : (
                "Attach Resume"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
