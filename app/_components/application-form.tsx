"use client";

import { z } from "zod";
import { insertApplicationSchema } from "../db/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";

import {
  getStatusDisplay,
  getStatusKind,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AiExtractForm } from "./ai-extract-form";
import { ApplicationFormFields } from "./application-form-fields";

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
  date_applied: z.string().or(z.date()),
  link: z.url(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema as any),
    defaultValues: defaultValues,
  });

  const onCancel = () => {
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
    const formattedDate = typeof values.date_applied === "string" 
      ? values.date_applied 
      : format(values.date_applied as unknown as Date, "yyyy-MM-dd");

    values = {
      ...values,
      date_applied: formattedDate,
      role_name: values.role_name.trim(),
      company_name: values.company_name.trim(),
      link: values.link.toLowerCase().trim(),
      description: values.description,
      location: values.location.trim(),
      platform: values.platform.toLowerCase().trim(),
      statusCategory: getStatusKind(values.status, values.statusCategory),
      status: getStatusDisplay(
        values.status,
        values.statusCategory
      )
        .trim(),
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

  return (
    <div className="w-full flex flex-col gap-2 items-center">
      <AiExtractForm isPending={isPending} onAutoFill={handleAutoFill} />

      {/* Divider */}
      <div className="w-full flex gap-1 items-center justify-center max-w-lg">
        <div className="h-px w-full bg-border"></div>
        <span>OR</span>
        <div className="h-px w-full bg-border"></div>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid grid-cols-2 w-full gap-3 max-w-lg"
        >
          <ApplicationFormFields
            form={form}
            isPending={isPending}
            onCancel={onCancel}
          />
        </form>
      </Form>
    </div>
  );
};
