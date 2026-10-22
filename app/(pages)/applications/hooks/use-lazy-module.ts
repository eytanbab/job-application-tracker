"use client";

import { useEffect, useState } from "react";

/**
 * Loads a module outside the first page bundle and returns it once ready
 * (null before that). It loads as soon as `needed` is true, and with
 * `preloadWhenIdle` also once the browser is idle, so it is usually ready
 * before the user asks for it.
 *
 * Callers open their sheet or dialog only when the module is loaded, so it
 * never shows up empty while its code downloads.
 */
export function useLazyModule<T>(
  load: () => Promise<T>,
  { needed, preloadWhenIdle = false }: { needed: boolean; preloadWhenIdle?: boolean },
): T | null {
  const [loaded, setLoaded] = useState<T | null>(null);

  useEffect(() => {
    if (loaded || (!needed && !preloadWhenIdle)) return;
    let cancelled = false;
    const start = () => {
      load().then(
        (mod) => {
          if (!cancelled) setLoaded(mod);
        },
        (err) => console.error("Failed to load module:", err),
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
