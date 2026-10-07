"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ClipboardPaste,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { FormValues } from "./application-form";
import { AiData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const aiFormSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, { message: "Please paste a job posting URL." })
    .transform((val) =>
      val && !/^https?:\/\//i.test(val) ? `https://${val}` : val,
    )
    .pipe(z.url({ message: "Please enter a valid job posting URL." })),
});

interface AiExtractFormProps {
  isPending: boolean;
  onAutoFill: (autoFillValues: FormValues) => void;
}

export function AiExtractForm({ isPending, onAutoFill }: AiExtractFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    mode: "onSubmit",
    defaultValues: {
      url: "",
    },
  });

  const handlePasteUrl = async () => {
    if (isPending || isLoading) return;
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text ? text.trim() : "";
      if (trimmed.length > 0) {
        aiForm.setValue("url", trimmed, {
          shouldValidate: true,
          shouldDirty: true,
        });
        if (extractError) setExtractError(null);
        if (isExtracted) setIsExtracted(false);
        toast({
          title: "URL pasted from clipboard",
          description: "Click 'Auto-Extract' or press Enter to extract details.",
        });
      } else {
        toast({
          title: "Clipboard empty",
          description: "No text found on your clipboard to paste.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Clipboard permission denied",
        description: "Please paste the URL directly into the input field.",
        variant: "destructive",
      });
    }
  };

  const handleAiSubmit = async (values: z.infer<typeof aiFormSchema>) => {
    setIsLoading(true);
    setExtractError(null);
    setIsExtracted(false);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: values.url }),
      });

      if (!response.ok) {
        setExtractError(
          `Server status ${response.status}: Could not scrape posting.`,
        );
        toast({
          title: "Extraction failed",
          description: `Unable to read job details from this URL. Please enter details manually below.`,
          variant: "destructive",
        });
        return;
      }

      const aiAutoFill: AiData = await response.json();

      if (aiAutoFill.status === "fail") {
        setExtractError("Job details could not be parsed from this page.");
        toast({
          title: "Parsing failed",
          description:
            "Could not parse job details. Please fill out the form manually.",
          variant: "destructive",
        });
        return;
      }

      const autoFillValues: FormValues = {
        date_applied: format(Date.now(), "yyyy-MM-dd"),
        role_name: aiAutoFill.application.role_name,
        company_name: aiAutoFill.application.company_name,
        link: values.url,
        platform: aiAutoFill.application.platform,
        status: "Applied",
        statusCategory: "applied",
        description: aiAutoFill.application.description ?? "",
        location: aiAutoFill.application.location,
        month: "",
        year: "",
        salary: "",
      };

      onAutoFill(autoFillValues);
      setIsExtracted(true);
      toast({
        title: "Job details extracted! ✨",
        description: "Form populated below. Review and save your application.",
      });
    } catch (error) {
      console.error("Error extracting AI application data:", error);
      setExtractError("Network or scraping error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-primary/5 to-card/60 p-3.5 sm:p-4 shadow-2xs transition-all space-y-3">
      {/* Hero Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-foreground tracking-tight">
                AI Fast-Fill from Job URL
              </h4>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/20">
                Flagship
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Paste a link (LinkedIn, Indeed, etc.) to extract job details instantly.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer shrink-0 transition-colors py-1 px-2 rounded-lg hover:bg-primary/10 select-none"
          aria-expanded={isOpen}
          title={isOpen ? "Minimize AI Fast-Fill" : "Expand AI Fast-Fill"}
        >
          <span>{isOpen ? "Minimize" : "Expand"}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {isOpen && (
        <Form {...aiForm}>
          <div className="flex flex-col gap-2.5 pt-0.5">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
              <FormField
                control={aiForm.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="space-y-1 flex-1">
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Paste LinkedIn, Indeed, Greenhouse, or any job URL..."
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              aiForm.handleSubmit(handleAiSubmit)();
                            }
                          }}
                          onChange={(e) => {
                            field.onChange(e);
                            if (extractError) setExtractError(null);
                            if (isExtracted) setIsExtracted(false);
                          }}
                          className="h-9 text-xs pr-18 bg-background/90 shadow-2xs focus-visible:ring-primary/40"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handlePasteUrl}
                          disabled={isPending || isLoading}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
                          title="Paste from clipboard"
                        >
                          <ClipboardPaste className="h-3 w-3" />
                          <span>Paste</span>
                        </Button>
                      </div>
                    </FormControl>
                    {extractError && (
                      <p className="text-xs font-medium text-destructive pt-0.5">
                        {extractError} You can enter details manually below.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={aiForm.handleSubmit(handleAiSubmit)}
                disabled={isPending || isLoading}
                className="h-9 px-4 text-xs font-semibold shrink-0 cursor-pointer shadow-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Auto-Extract</span>
                  </>
                )}
              </Button>
            </div>

            {isExtracted && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Job details extracted! Review the populated fields below and click Add Application.</span>
              </div>
            )}
          </div>
        </Form>
      )}
    </div>
  );
}
