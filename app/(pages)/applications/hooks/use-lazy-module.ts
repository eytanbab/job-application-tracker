"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Loads a module outside the first page bundle and returns it once ready
 * (null before that). It loads as soon as `needed` is true, and with
 * `preloadWhenIdle` also once the browser is idle, so it is usually ready
 * before the user asks for it.
 *
 * Callers open their sheet or dialog only when the module is loaded, so it
 * never shows up empty while its code downloads. If a load the user asked
 * for fails (offline, or a deploy replaced the chunk), `onFailed` should
 * withdraw the request, so asking again retries.
 */
export function useLazyModule<T>(
  load: () => Promise<T>,
  {
    needed,
    preloadWhenIdle = false,
    onFailed,
  }: { needed: boolean; preloadWhenIdle?: boolean; onFailed?: () => void },
): T | null {
  const [loaded, setLoaded] = useState<T | null>(null);
  const onFailedRef = useRef(onFailed);
  useEffect(() => {
    onFailedRef.current = onFailed;
  });

  useEffect(() => {
    if (loaded || (!needed && !preloadWhenIdle)) return;
    let cancelled = false;
    const start = () => {
      load().then(
        (mod) => {
          if (!cancelled) setLoaded(mod);
        },
        (err) => {
          console.error("Failed to load module:", err);
          // A failed idle preload stays quiet; the user's own request retries
          if (cancelled || !needed) return;
          toast({
            description: "Couldn't open this. Check your connection and try again.",
            variant: "destructive",
          });
          onFailedRef.current?.();
        },
      );
    };
    if (needed) {
      start();
      return () => {
        cancelled = true;
      };
    }
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }
    const id = setTimeout(start, 1500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [load, loaded, needed, preloadWhenIdle]);

  return loaded;
}
