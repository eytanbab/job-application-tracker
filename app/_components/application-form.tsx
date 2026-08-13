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
import { AiExtractForm } from "./ai-extract-form";
import { ApplicationFormFields } from "./application-form-fields";
import { getDistinctLocationsAndPlatforms } from "@/app/actions/applications";

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
    .trim()
    .transform((val) =>
      val && !/^https?:\/\//i.test(val) ? `https://${val}` : val,
    )
    .pipe(
      z.union([
        z.literal(""),
        z.url({ message: "Please enter a valid URL." }),
      ])
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

  const onCancel = () => {
    if (form.formState.isDirty) {
      const confirmDiscard = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?",
      );
      if (!confirmDiscard) return;
    }
    onClose();
    if (!defaultValues?.id) {
      router.push("/applications");
    }
  };

  const handleAutoFill = (autoFillValues: FormValues) => {
    Object.entries(autoFillValues).forEach(([key, value]) => {
      form.setValue(key as keyof FormValues, value);
    });
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
      link: values.link.toLowerCase().trim(),
      description: values.description,
      location: values.location.trim(),
      platform: values.platform.toLowerCase().trim(),
      statusCategory: cat,
      status: resolvedStatus,
      salary: values.salary?.trim() || "",
    };

    startTransition(async () => {
      try {
        await onSubmit(values);
        onClose();
        if (!defaultValues?.id) {
          router.push("/applications");
        }
      } catch {
        toast({
          description: "Failed to save application.",
          variant: "destructive",
        });
      }
    });
  };

  const isEditing = Boolean(defaultValues?.id);

  return (
    <div className="w-full flex flex-col gap-3 items-center">
      {!isEditing && (
        <>
          <AiExtractForm isPending={isPending} onAutoFill={handleAutoFill} />

          {/* Divider */}
          <div className="w-full flex items-center justify-center max-w-lg my-1">
            <div className="h-px flex-1 bg-border/60"></div>
            <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Or Enter Manually
            </span>
            <div className="h-px flex-1 bg-border/60"></div>
          </div>
        </>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid grid-cols-2 w-full gap-3 max-w-lg"
        >
          <ApplicationFormFields
            form={form}
            isPending={isPending}
            onCancel={onCancel}
            userLocations={userOptions.userLocations}
            userPlatforms={userOptions.userPlatforms}
          />
        </form>
      </Form>
    </div>
  );
};
