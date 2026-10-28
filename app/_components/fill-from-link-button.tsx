"use client";

import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeJobLink } from "@/lib/utils";
import { extractJobDetails } from "./extract-job-details";
import type { FormValues } from "./application-form";

// Fields a posting can fill, with the names used in the summary toast
const FILLABLE: [keyof FormValues, string][] = [
  ["role_name", "role"],
  ["company_name", "company"],
  ["location", "location"],
  ["platform", "platform"],
  ["salary", "salary"],
  ["description", "description"],
];

/**
 * Reads the saved job link again and fills the fields that are still empty.
 * Never overwrites what the user already has.
 */
export function FillFromLinkButton({ form }: { form: UseFormReturn<FormValues> }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const link = form.watch("link");
  if (!normalizeJobLink(link)) return null;

  const fill = async () => {
    setIsLoading(true);
    try {
      const result = await extractJobDetails(link ?? "");
      if (!result.ok) {
        toast({
          variant: result.reason === "failed" ? "destructive" : "default",
          description:
            result.reason === "sign-in"
              ? "Sign in to fill fields from the link."
              : result.reason === "quota"
                ? (result.message ?? "You've used today's AI autofills.")
                : "Couldn't read that posting. Check the link and try again.",
        });
        return;
      }
      const filled: string[] = [];
      for (const [name, label] of FILLABLE) {
        const current = String(form.getValues(name) ?? "").trim();
        const found = String(result.values[name] ?? "").trim();
        if (!current && found) {
          form.setValue(name, found, { shouldDirty: true, shouldValidate: true });
          filled.push(label);
        }
      }
      toast({
        description: filled.length
          ? `Filled ${filled.join(", ")} from ${result.domain}. Review and save.`
          : `Nothing to add from ${result.domain}: those fields are already filled.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={fill}
      disabled={isLoading}
      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer disabled:cursor-wait"
      title="Fill empty fields from the job posting"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : (
        <RefreshCw className="h-3 w-3" aria-hidden />
      )}
      {isLoading ? "Reading posting..." : "Fill empty fields from link"}
    </button>
  );
}
