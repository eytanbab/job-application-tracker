"use client";

import { useState, useTransition } from "react";
import { SignInButton } from "@clerk/nextjs";
import { format } from "date-fns";
import { Loader2, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWeeklySummary, type WeeklySummaryResponse } from "@/app/actions/analytics-summary";
import { Panel, PanelTitle } from "./analytics-section";

const SECTIONS = [
  { key: "whatChanged", label: "What changed" },
  { key: "whatIsStuck", label: "What is stuck" },
  { key: "suggestion", label: "Next step" },
] as const;

/**
 * Opt-in AI summary of the last 7 days. Nothing is sent to the model until
 * the user asks, and then only counts.
 */
export function WeeklySummaryCard({ signedIn }: { signedIn: boolean }) {
  const [result, setResult] = useState<WeeklySummaryResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = () =>
    startTransition(async () => {
      setResult(await generateWeeklySummary());
    });

  const needsSignIn = !signedIn || (result && !result.success && result.code === "auth_required");

  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <PanelTitle>Weekly summary</PanelTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your last 7 days against the 7 before, in plain words. Only counts are sent to the AI, never company
            names, roles or notes.
          </p>
        </div>
        {needsSignIn ? (
          <SignInButton mode="modal">
            <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5 cursor-pointer">
              <LogIn className="h-3.5 w-3.5" aria-hidden />
              Sign in to get a summary
            </Button>
          </SignInButton>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 cursor-pointer"
            onClick={generate}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            {isPending ? "Writing summary…" : result?.success ? "Refresh summary" : "Write my summary"}
          </Button>
        )}
      </div>

      <div aria-live="polite" className="min-w-0">
        {result?.success && (
          <>
            <dl className="grid gap-3 sm:grid-cols-3">
              {SECTIONS.map(({ key, label }) => (
                <div key={key} className="min-w-0">
                  <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                  <dd className="text-sm text-foreground mt-0.5">{result.summary[key]}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-muted-foreground mt-3">
              {result.source === "ai"
                ? "Written by AI from the counts on this page; sentences with numbers it could not back up are removed."
                : "Written from your counts by fixed rules, because no AI key is set on this server."}{" "}
              Generated {format(new Date(result.generatedAt), "d MMM, HH:mm")}.
            </p>
          </>
        )}
        {result && !result.success && result.code !== "auth_required" && (
          <p role="alert" className="text-sm text-destructive">
            {result.error}
          </p>
        )}
      </div>
    </Panel>
  );
}
