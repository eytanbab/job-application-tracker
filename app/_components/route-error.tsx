"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type RouteErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

type RouteErrorFallbackProps = RouteErrorProps & {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
};

// Shared fallback UI for the route segment `error.tsx` boundaries.
export function RouteErrorFallback({
  error,
  retry,
  title,
  description,
  backHref = "/applications",
  backLabel = "Back to Applications",
}: RouteErrorFallbackProps) {
  useEffect(() => {
    // No-op unless Sentry was initialised with a DSN
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col gap-6 w-full" role="alert">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">
                Something went wrong on our side.
              </p>
              <p className="text-sm text-muted-foreground">
                Your data is safe. Try again, and if the problem keeps
                happening, come back in a few minutes.
              </p>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && (
            <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground whitespace-pre-wrap break-words">
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ""}
            </pre>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {backLabel}
              </Link>
            </Button>
            <Button onClick={() => retry()}>
              <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
