"use client";

import { useEffect, useRef, useState } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Link2,
  ClipboardPaste,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { extractDomainFromUrl, detectPlatformFromUrl } from "@/lib/utils";
import { FormValues } from "./application-form";
import { AiData } from "@/lib/types";
import { formatQuotaExceededMessage } from "@/lib/ai-quota";

export interface LinkAutofillBarProps {
  onAutoFill: (values: Partial<FormValues>, domain: string) => void;
  onEnterManually: (initialUrl?: string) => void;
  onCancel: () => void;
  onExtractionFailed: (url: string) => void;
  isPending?: boolean;
  /** Whether autofill needs a signed-in user (false in the local demo). */
  aiRequiresSignIn?: boolean;
}

const formatLocalTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function LinkAutofillBar({
  onAutoFill,
  onEnterManually,
  onCancel,
  onExtractionFailed,
  isPending = false,
  aiRequiresSignIn = true,
}: LinkAutofillBarProps) {
  const { toast } = useToast();
  const { isLoaded, isSignedIn } = useAuth();
  // Set when the server rejects the session (e.g. it expired in another tab)
  const [authRejected, setAuthRejected] = useState(false);
  const [url, setUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Extraction can take up to the route's 30s limit; say so after a few seconds
  useEffect(() => {
    if (!isExtracting) return;
    const timer = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(timer);
  }, [isExtracting]);

  // Abort an in-flight extraction when the user leaves this step
  useEffect(() => () => abortRef.current?.abort(), []);

  const needsSignIn =
    aiRequiresSignIn && ((isLoaded && !isSignedIn) || authRejected);

  const detectedDomain = extractDomainFromUrl(url);
  const detectedPlatform = url.trim() ? detectPlatformFromUrl(url) : null;

  const handleExtract = async () => {
    const trimmed = url.trim();
    if (!trimmed || isExtracting || isPending || needsSignIn) return;

    const validUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setIsExtracting(true);
    setIsSlow(false);
    setExtractError(null);

    const domain = extractDomainFromUrl(validUrl);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: validUrl }),
        signal: controller.signal,
      });

      if (response.status === 401) {
        setAuthRejected(true);
        setExtractError(
          "Sign in to autofill from this link, or enter the details manually.",
        );
        return;
      }

      if (response.status === 429) {
        const body: AiData = await response.json();
        const resetAt =
          body.status === "fail" && body.resetAt ? new Date(body.resetAt) : null;
        toast({
          title: "Daily autofill limit reached",
          description:
            resetAt && body.status === "fail" && body.limit !== undefined
              ? formatQuotaExceededMessage(
                  "extract",
                  body.limit,
                  resetAt,
                  new Date(),
                  formatLocalTime,
                )
              : "You've used today's AI autofills. Your link is kept so you can enter the details manually.",
        });
        onExtractionFailed(validUrl);
        return;
      }

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
        // Leave unknown locations empty so the required-field check asks
        // the user, rather than presenting a guess as extracted data.
        location: aiData.application.location || "",
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
      // The user cancelled or switched to manual entry; nothing to report
      if (controller.signal.aborted) return;
      console.error("Autofill extraction error:", err);
      toast({
        title: "Could not auto-extract details",
        description:
          "Preserved your link in the form so you can enter details manually.",
        variant: "default",
      });
      onExtractionFailed(validUrl);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
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
          description: needsSignIn
            ? "Sign in to autofill, or enter the details manually."
            : "Click Autofill or press Enter to extract details.",
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
                if (url.trim() && !isExtracting && !needsSignIn) {
                  handleExtract();
                }
              }
            }}
            placeholder="Paste a job posting URL"
            className="pl-9 pr-20 h-10 bg-background shadow-2xs focus-visible:ring-primary/40 rounded-xl"
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

      {needsSignIn && (
        <div
          data-testid="autofill-sign-in-prompt"
          className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5"
        >
          <LogIn className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Autofill is available when you&apos;re signed in.
            </strong>{" "}
            It reads the posting with AI so you don&apos;t have to copy each
            field. You can still track this application as a guest: enter the
            details manually and your link comes with you.
          </p>
        </div>
      )}

      {isExtracting && isSlow && (
        <p role="status" className="text-[11px] text-muted-foreground">
          Still working. This can take up to 30 seconds, or you can enter the
          details manually.
        </p>
      )}

      {/* Phones: Autofill, Cancel, then manual entry, each full width.
          Wider screens: manual entry left, actions right. */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-border/30">
        <Button
          type="button"
          variant="ghost"
          data-testid="enter-manually-button"
          onClick={() => {
            abortRef.current?.abort();
            onEnterManually(url.trim() ? url.trim() : undefined);
          }}
          className="h-10 sm:h-9 w-full sm:w-auto sm:px-1 text-xs text-muted-foreground hover:text-foreground hover:bg-transparent font-medium cursor-pointer gap-1 group"
        >
          <span>Enter details manually</span>
          <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
        </Button>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              abortRef.current?.abort();
              onCancel();
            }}
            disabled={isPending}
            className="h-10 sm:h-9 w-full sm:w-auto px-3.5 text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          {needsSignIn ? (
            <SignInButton mode="modal">
              <Button
                type="button"
                data-testid="autofill-sign-in-button"
                onClick={() => {
                  setAuthRejected(false);
                  setExtractError(null);
                }}
                className="h-10 sm:h-9 w-full sm:w-auto px-4 text-xs font-semibold rounded-xl cursor-pointer gap-1.5 shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in to autofill</span>
              </Button>
            </SignInButton>
          ) : (
            <Button
              type="button"
              onClick={handleExtract}
              disabled={!url.trim() || isExtracting || isPending}
              data-testid="autofill-button"
              className="h-10 sm:h-9 w-full sm:w-auto px-4 text-xs font-semibold rounded-xl cursor-pointer gap-1.5 shadow-xs"
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
          )}
        </div>
      </div>
    </div>
  );
}
