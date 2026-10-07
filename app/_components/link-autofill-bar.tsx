"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Link2,
  ClipboardPaste,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractDomainFromUrl, detectPlatformFromUrl } from "@/lib/utils";
import { FormValues } from "./application-form";
import { AiData } from "@/lib/types";

export interface LinkAutofillBarProps {
  onAutoFill: (values: Partial<FormValues>, domain: string) => void;
  onEnterManually: (initialUrl?: string) => void;
  onCancel: () => void;
  onExtractionFailed: (url: string) => void;
  isPending?: boolean;
}

export function LinkAutofillBar({
  onAutoFill,
  onEnterManually,
  onCancel,
  onExtractionFailed,
  isPending = false,
}: LinkAutofillBarProps) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const detectedDomain = extractDomainFromUrl(url);
  const detectedPlatform = url.trim() ? detectPlatformFromUrl(url) : null;

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed || isExtracting || isPending) return;

    const validUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setIsExtracting(true);
    setExtractError(null);

    const domain = extractDomainFromUrl(validUrl);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validUrl }),
      });

      if (!response.ok) {
        toast({
          title: "Could not auto-extract details",
          description:
            "Preserved your link in the form so you can enter details manually.",
          variant: "default",
        });
        onExtractionFailed(validUrl);
        return;
      }

      const aiData: AiData = await response.json();

      if (aiData.status === "fail" || !aiData.application) {
        toast({
          title: "Could not auto-extract details",
          description:
            "Preserved your link in the form so you can enter details manually.",
          variant: "default",
        });
        onExtractionFailed(validUrl);
        return;
      }

      const domainName = domain || "job posting";
      const inferredPlatform =
        aiData.application.platform?.trim() || detectPlatformFromUrl(validUrl);

      const extractedValues: Partial<FormValues> = {
        role_name: aiData.application.role_name || "",
        company_name: aiData.application.company_name || "",
        link: validUrl,
        platform: inferredPlatform,
        location: aiData.application.location || "Remote",
        description: aiData.application.description || "",
        status: "Applied",
        statusCategory: "applied",
      };

      onAutoFill(extractedValues, domainName);
      toast({
        title: "Job details extracted",
        description: `Autofilled from ${domainName}. Review and save your application.`,
      });
    } catch (err) {
      console.error("Autofill extraction error:", err);
      toast({
        title: "Could not auto-extract details",
        description:
          "Preserved your link in the form so you can enter details manually.",
        variant: "default",
      });
      onExtractionFailed(validUrl);
    } finally {
      setIsExtracting(false);
    }
  };

  const handlePasteClipboard = async () => {
    if (isExtracting || isPending) return;
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text ? text.trim() : "";
      if (trimmed.length > 0) {
        setUrl(trimmed);
        if (extractError) setExtractError(null);
        toast({
          title: "URL pasted from clipboard",
          description: "Click Autofill or press Enter to extract details.",
        });
      } else {
        toast({
          title: "Clipboard is empty",
          description: "No text found on clipboard to paste.",
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

  return (
    <div className="p-4 sm:p-5 space-y-4 w-full">
      <div className="space-y-1">
        <label
          htmlFor="job-posting-url"
          className="text-xs font-semibold text-foreground tracking-tight"
        >
          Job Posting Link
        </label>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Paste a link from LinkedIn, Indeed, Greenhouse, Lever, or any job board.
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-muted-foreground pointer-events-none">
            <Link2 className="h-4 w-4" />
          </div>
          <Input
            id="job-posting-url"
            type="url"
            autoFocus
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (extractError) setExtractError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (url.trim() && !isExtracting) {
                  handleExtract();
                }
              }
            }}
            placeholder="https://linkedin.com/jobs/view/... or any job URL"
            className="pl-9 pr-20 h-10 text-xs bg-background shadow-2xs focus-visible:ring-primary/40 rounded-xl"
            disabled={isExtracting || isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePasteClipboard}
            disabled={isExtracting || isPending}
            className="absolute right-1.5 h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 cursor-pointer rounded-lg"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span>Paste</span>
          </Button>
        </div>

        {detectedDomain && detectedPlatform && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-0.5 animate-in fade-in duration-150">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/70 shrink-0" />
            <span>
              Platform detected:{" "}
              <strong className="text-foreground font-medium">
                {detectedPlatform}
              </strong>{" "}
              ({detectedDomain})
            </span>
          </div>
        )}

        {extractError && (
          <div className="text-xs text-destructive flex items-center gap-1.5 pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <button
          type="button"
          data-testid="enter-manually-button"
          onClick={() => onEnterManually(url.trim() ? url.trim() : undefined)}
          className="text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer inline-flex items-center gap-1 transition-colors group"
        >
          <span>or enter details manually</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isExtracting || isPending}
            className="h-9 px-3.5 text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleExtract}
            disabled={!url.trim() || isExtracting || isPending}
            data-testid="autofill-button"
            className="h-9 px-4 text-xs font-semibold rounded-xl cursor-pointer gap-1.5 shadow-xs"
          >
            {isExtracting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <span>Autofill</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
