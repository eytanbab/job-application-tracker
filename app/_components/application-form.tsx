"use client";

import { z } from "zod";
import { insertApplicationSchema } from "../db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

import {
  getStatusDisplay,
  getStatusKind,
  safeFormatDate,
  resolveUpdatedStatus,
  StatusKind,
  isStatusKind,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LinkAutofillBar } from "./link-autofill-bar";
import { ApplicationFormFields } from "./application-form-fields";
import { getDistinctLocationsAndPlatforms } from "@/app/actions/applications";
import { deleteFile } from "@/app/actions/documents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createApplicationSchema = insertApplicationSchema.omit({
  userId: true,
  id: true,
});

export type FormValues = z.input<typeof createApplicationSchema>;

type Props = {
  defaultValues: FormValues & { id?: string };
  onSubmit: (values: FormValues) => Promise<void>;
  onClose: () => void;
};

const formSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  role_name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  company_name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  date_applied: z.any(),
  link: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      const str = (val ?? "").trim();
      return str && !/^https?:\/\//i.test(str) ? `https://${str}` : str;
    })
    .pipe(
      z.union([
        z.literal(""),
        z.url({ message: "Please enter a valid URL." }),
      ]),
    ),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  platform: z.string().min(2, {
    message: "Platform name must be at least 2 characters.",
  }),
  status: z.string().min(2, {
    message: "Status name must be at least 2 characters.",
  }),
  statusCategory: z.string().min(2, {
    message: "Choose a status category.",
  }),
  month: z.string().optional(),
  year: z.string().optional(),
  salary: z.string().nullable().optional(),
  resumeId: z.string().nullable().optional(),
});

export const ApplicationForm = ({
  defaultValues,
  onSubmit,
  onClose,
}: Props) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [userOptions, setUserOptions] = useState<{
    userLocations: string[];
    userPlatforms: string[];
  }>({
    userLocations: [],
    userPlatforms: [],
  });

  useEffect(() => {
    getDistinctLocationsAndPlatforms()
      .then((res) => {
        if (res) setUserOptions(res);
      })
      .catch(() => {});
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: defaultValues,
  });

  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [sessionUploadedDocIds, setSessionUploadedDocIds] = useState<string[]>([]);

  const cleanupSessionUploads = () => {
    if (sessionUploadedDocIds.length > 0) {
      sessionUploadedDocIds.forEach((docId) => {
        deleteFile(docId).catch(console.error);
      });
      setSessionUploadedDocIds([]);
    }
  };

  const handleCloseForm = (discardUploads = false) => {
    if (discardUploads) {
      cleanupSessionUploads();
    }
    onClose();
    if (!defaultValues?.id) {
      router.push("/applications");
    }
  };

  const onCancel = () => {
    if (form.formState.isDirty || sessionUploadedDocIds.length > 0) {
      setIsDiscardDialogOpen(true);
      return;
    }
    handleCloseForm(false);
  };

  const isEditing = Boolean(defaultValues?.id);
  const [entryMode, setEntryMode] = useState<"link" | "manual">(
    isEditing ? "manual" : "link",
  );
  const [extractedFromDomain, setExtractedFromDomain] = useState<string | null>(
    null,
  );

  const handleAutoFill = (
    autoFillValues: Partial<FormValues>,
    domain: string,
  ) => {
    Object.entries(autoFillValues).forEach(([key, value]) => {
      form.setValue(key as keyof FormValues, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    });
    setExtractedFromDomain(domain);
    setEntryMode("manual");
  };

  const handleEnterManually = (initialUrl?: string) => {
    if (initialUrl) {
      form.setValue("link", initialUrl, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    setEntryMode("manual");
  };

  const handleExtractionFailed = (url: string) => {
    if (url) {
      form.setValue("link", url, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
    setEntryMode("manual");
  };

  const handleSubmit = (values: FormValues) => {
    const formattedDate = safeFormatDate(values.date_applied, "yyyy-MM-dd");
    const cat = (
      values.statusCategory && isStatusKind(values.statusCategory)
        ? values.statusCategory
        : getStatusKind(values.status)
    ) as StatusKind;
    const resolvedStatus = resolveUpdatedStatus(values.status, cat);

    values = {
      ...values,
      date_applied: formattedDate,
      role_name: values.role_name.trim(),
      company_name: values.company_name.trim(),
      link: values.link?.trim() || "",
      description: values.description,
      location: values.location.trim(),
      platform: values.platform.toLowerCase().trim(),
      statusCategory: cat,
      status: resolvedStatus,
      salary: values.salary?.trim() || "",
      resumeId: values.resumeId || null,
    };

    startTransition(async () => {
      try {
        await onSubmit(values);
        onClose();
        if (!defaultValues?.id) {
          router.push("/applications");
        }
      } catch (err) {
        console.error("Failed to save application:", err);
      }
    });
  };

  const { isDirty } = form.formState;
  const isSaveDisabled =
    isPending || isUploadingResume || (isEditing && !isDirty);

  if (entryMode === "link") {
    return (
      <div className="flex-1 flex flex-col min-h-0 w-full">
        <LinkAutofillBar
          onAutoFill={handleAutoFill}
          onEnterManually={handleEnterManually}
          onCancel={() => handleCloseForm(false)}
          onExtractionFailed={handleExtractionFailed}
          isPending={isPending}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-1 flex flex-col min-h-0 w-full justify-between"
        >
          {/* Scrollable form body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 min-h-0 [scrollbar-width:thin]">
            {!isEditing && (
              <>
                {extractedFromDomain ? (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium truncate">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="truncate">
                        Autofilled from{" "}
                        <strong className="font-semibold text-emerald-800 dark:text-emerald-200">
                          {extractedFromDomain}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEntryMode("link")}
                      className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Paste different link
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pb-0.5">
                    <button
                      type="button"
                      onClick={() => setEntryMode("link")}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to link autofill</span>
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 w-full gap-3">
              <ApplicationFormFields
                form={form}
                isPending={isPending}
                userLocations={userOptions.userLocations}
                userPlatforms={userOptions.userPlatforms}
                onUploadingResumeChange={setIsUploadingResume}
                onDocumentUploaded={(id) =>
                  setSessionUploadedDocIds((prev) => [...prev, id])
                }
              />
            </div>
          </div>

          {/* Grounded bottom action bar */}
          <div className="px-4 sm:px-6 py-3 border-t border-border/30 bg-card shrink-0 flex flex-col sm:flex-row gap-2 w-full z-10">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending || isUploadingResume}
              className="h-10 text-xs rounded-xl cursor-pointer order-2 sm:order-1 w-full sm:w-1/3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaveDisabled}
              className="h-10 text-xs font-semibold rounded-xl shadow-xs cursor-pointer order-1 sm:order-2 w-full sm:flex-1"
              title={isEditing && !isDirty ? "No changes to save" : undefined}
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : isUploadingResume ? (
                <span className="flex items-center gap-1.5 justify-center">
                  <Loader2 className="size-4 animate-spin" />
                  Uploading Resume...
                </span>
              ) : isEditing ? (
                isDirty ? "Save Changes" : "No Changes"
              ) : (
                "Add Application"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* In-app Discard Confirmation Dialog */}
      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard Unsaved Changes?</DialogTitle>
            <DialogDescription>
              {sessionUploadedDocIds.length > 0
                ? "You have unsaved changes and an unattached uploaded resume. Discarding will also remove the uploaded file from your library."
                : "You have modified this job application. Are you sure you want to discard your changes?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDiscardDialogOpen(false)}
              className="cursor-pointer"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setIsDiscardDialogOpen(false);
                handleCloseForm(true);
              }}
              className="cursor-pointer"
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
