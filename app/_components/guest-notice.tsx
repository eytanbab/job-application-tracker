"use client";

import { useSyncExternalStore } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "jat:guest-notice-dismissed";

// Dismissal is remembered in localStorage; the in-memory flag covers browsers
// where storage is unavailable, so the banner still hides for this page view.
let dismissedInMemory = false;
const listeners = new Set<() => void>();

function readDismissed(): boolean {
  if (dismissedInMemory) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function dismiss() {
  dismissedInMemory = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked (e.g. private mode); the in-memory flag still applies.
  }
  listeners.forEach((listener) => listener());
}

/** Tells guests their data lives in this browser only. Render for guests only. */
export function GuestNotice() {
  const { isSignedIn } = useAuth();
  // Server render assumes dismissed so the banner never flashes before
  // the stored choice is read.
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);

  if (dismissed || isSignedIn) return null;

  return (
    <div
      role="region"
      aria-label="Guest workspace notice"
      className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm sm:items-center"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" aria-hidden />
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-foreground">
          Your applications are saved in this browser only. Sign in to keep them
          and use them on other devices.
        </p>
        <SignInButton mode="modal">
          <Button size="sm" className="self-start sm:self-auto">
            Sign in
          </Button>
        </SignInButton>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label="Dismiss notice"
        className="-my-1 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X />
      </Button>
    </div>
  );
}
