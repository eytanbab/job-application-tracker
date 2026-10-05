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
import { Loader2, CheckCircle2, Sparkles, ChevronDown } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);
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
    <div className="w-full max-w-lg rounded-xl border border-primary/20 bg-primary/5 p-3 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary shrink-0" />
          <span>Auto-fill details from job URL</span>
        </span>
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          {isOpen ? "Hide" : "Try AI"}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </span>
      </button>

      {isOpen && (
        <Form {...aiForm}>
          <form
            onSubmit={aiForm.handleSubmit(handleAiSubmit)}
            className="flex flex-col w-full gap-2.5 pt-3 mt-2.5 border-t border-primary/10"
          >
            <FormField
              control={aiForm.control}
              name="url"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">
                    Job Posting URL for AI Auto-Fill
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Paste LinkedIn, Indeed, or job URL..."
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (extractError) setExtractError(null);
                        if (isExtracted) setIsExtracted(false);
                      }}
                      className="h-9 text-xs bg-background/80"
                    />
                  </FormControl>
                  {extractError && (
                    <p className="text-xs font-medium text-destructive pt-0.5">
                      {extractError} You can enter details manually below.
                    </p>
                  )}
                  {isExtracted && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span>Job details extracted! Form populated below.</span>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending || isLoading}
              className="h-9 text-xs font-semibold cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Extracting details...
                </>
              ) : (
                "✨ Auto-Extract Details with AI"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Pastes job title, company, description & location automatically.
            </p>
          </form>
        </Form>
      )}
    </div>
  );
}
