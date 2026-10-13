"use client";

import { SignInButton } from "@clerk/nextjs";
import { CheckCircle2, LogIn, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const WHAT_YOU_GET = [
  "A 0–100 match score against the job description",
  "Matched and missing keywords, with where to add them",
  "ATS formatting checks and rewritten bullet points",
];

/** Shown to guests: the ATS scan runs on a paid AI model. */
export function AtsSignInGate() {
  return (
    <Card data-testid="ats-sign-in-gate" className="max-w-xl rounded-2xl">
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
          <ScanSearch className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">Sign in to run an ATS scan</CardTitle>
        <CardDescription>
          The ATS checker reads your resume and the job description with AI,
          so it&apos;s available to signed-in users. Your applications stay
          trackable as a guest.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 pt-1 pb-2 text-sm text-muted-foreground">
          {WHAT_YOU_GET.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <SignInButton mode="modal">
          <Button className="gap-1.5 font-semibold cursor-pointer">
            <LogIn className="h-4 w-4" />
            <span>Sign in to continue</span>
          </Button>
        </SignInButton>
      </CardFooter>
    </Card>
  );
}
