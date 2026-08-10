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
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { FormValues } from "./application-form";
import { AiData } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const aiFormSchema = z.object({
  url: z.url(),
});

interface AiExtractFormProps {
  isPending: boolean;
  onAutoFill: (autoFillValues: FormValues) => void;
}

export function AiExtractForm({ isPending, onAutoFill }: AiExtractFormProps) {
  const { toast } = useToast();
  const [aiValues, setAiValues] = useState<FormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleAiSubmit = async (values: z.infer<typeof aiFormSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: values.url }),
      });

      if (!response.ok) {
        toast({
          title: "Extraction failed",
          description: `Server responded with status ${response.status}`,
          variant: "destructive",
        });
        setAiValues(null);
        return;
      }

      const aiAutoFill: AiData = await response.json();

      if (aiAutoFill.status === "fail") {
        setAiValues(null);
        return;
      }

      const autoFillValues: FormValues = {
        date_applied: format(Date.now(), "yyyy-MM-dd"),
        role_name: aiAutoFill.application.role_name,
        company_name: aiAutoFill.application.company_name,
        link: aiAutoFill.application.link,
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
      setAiValues(autoFillValues);
    } catch (error) {
      console.error("Error extracting AI application data:", error);
      setAiValues(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...aiForm}>
      <form
        onSubmit={aiForm.handleSubmit(handleAiSubmit)}
        className="flex flex-col w-full gap-2 max-w-lg"
      >
        <FormField
          control={aiForm.control}
          name="url"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.linkedin.com/jobs/view/123456789/"
                  {...field}
                />
              </FormControl>
              {aiValues === null && (
                <p className="text-sm font-medium text-destructive">
                  Failed to extract information from the URL.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending || isLoading}>
          {isLoading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            "Auto-Extract Details"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          Extraction may take up to 1 minute.
        </p>
      </form>
    </Form>
  );
}
