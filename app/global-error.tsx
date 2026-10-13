"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";

import "./globals.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RouteErrorProps } from "./_components/route-error";

// Replaces the root layout when it fails, so it renders its own document and
// can't rely on any provider (theme, Clerk, nuqs) from app/layout.tsx.
export default function GlobalError({ error, retry }: RouteErrorProps) {
  useEffect(() => {
    // No-op unless Sentry was initialised with a DSN
    Sentry.captureException(error);
  }, [error]);

  useEffect(() => {
    // Mirror next-themes without its provider: stored choice, else the OS
    let theme: string | null = null;
    try {
      theme = window.localStorage.getItem("theme");
    } catch {
      // Storage can be unavailable (private mode, blocked site data)
    }
    const isDark =
      theme === "dark" ||
      (theme !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-background text-foreground">
        <title>Something went wrong | Job Application Tracker</title>
        <main
          className="flex min-h-screen items-center justify-center p-4 sm:p-6"
          role="alert"
        >
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col gap-4 p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive/10 p-2 text-destructive shrink-0">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    The app couldn&apos;t load. Your data is safe. Try again,
                    and if the problem keeps happening, come back in a few
                    minutes.
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
                {/* Plain anchor: a full reload rebuilds the root layout */}
                <Button variant="outline" asChild>
                  <a href="/applications">Back to Applications</a>
                </Button>
                <Button onClick={() => retry()}>
                  <RotateCcw className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Try again
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </body>
    </html>
  );
}
