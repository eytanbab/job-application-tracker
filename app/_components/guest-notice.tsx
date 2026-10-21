"use client";

import { useEffect, useSyncExternalStore } from "react";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GUEST_NOTICE_COOKIE } from "@/lib/guest-notice";

const STORAGE_KEY = "jat:guest-notice-dismissed";

// Dismissal is remembered in a cookie (so the server render already includes
// or omits the banner and the page doesn't shift) and in localStorage; the
// in-memory flag covers browsers where both are blocked.
let dismissedInMemory = false;
const listeners = new Set<() => void>();

function hasCookie(): boolean {
  return document.cookie.split("; ").includes(`${GUEST_NOTICE_COOKIE}=1`);
}

function writeCookie() {
  document.cookie = `${GUEST_NOTICE_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
}

function readDismissed(): boolean {
  if (dismissedInMemory || hasCookie()) return true;
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
  writeCookie();
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Storage blocked (e.g. private mode); the in-memory flag still applies.
  }
  listeners.forEach((listener) => listener());
}

/**
 * Tells guests their data lives in this browser only. Render for guests only.
 * `initialDismissed` comes from the cookie, so the server HTML matches.
 */
export function GuestNotice({ initialDismissed }: { initialDismissed: boolean }) {
  const { isSignedIn } = useAuth();
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => initialDismissed);

  // Dismissed before the cookie existed (localStorage only): add the cookie so
  // the next server render omits the banner.
  useEffect(() => {
    if (dismissed && !hasCookie()) writeCookie();
  }, [dismissed]);

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
