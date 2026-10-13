"use client";

import { useEffect, useState } from "react";
import { getApplicationDetails } from "@/app/actions/applications";

export type ApplicationDetails = {
  description: string | null;
  notes: string | null;
};

// List rows leave out the job description and notes (they can be large), so
// they're fetched when a row is opened. Cached per id for J/K back-and-forth.
const cache = new Map<string, ApplicationDetails>();

/** Records saved text so reopening the row shows it without a refetch. */
export function updateCachedApplicationDetails(
  id: string,
  details: Partial<ApplicationDetails>,
) {
  const current = cache.get(id);
  if (current) cache.set(id, { ...current, ...details });
}

/**
 * The description and notes of one application. `details` is null while
 * loading; `error` is set if the request failed.
 */
export function useApplicationDetails(id: string | null | undefined) {
  const [state, setState] = useState<{
    id: string | null;
    details: ApplicationDetails | null;
    error: boolean;
  }>(() => ({
    id: id ?? null,
    details: (id && cache.get(id)) || null,
    error: false,
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    const cached = cache.get(id);
    if (cached) {
      setState({ id, details: cached, error: false });
      return;
    }

    let cancelled = false;
    setState({ id, details: null, error: false });
    getApplicationDetails(id)
      .then((result) => {
        const details = result ?? { description: null, notes: null };
        cache.set(id, details);
        if (!cancelled) setState({ id, details, error: false });
      })
      .catch((err) => {
        console.error("Failed to load application details:", err);
        if (!cancelled) setState({ id, details: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt]);

  // Ignore a result that belongs to the previously opened row
  const current = state.id === (id ?? null) ? state : null;
  return {
    details: current?.details ?? null,
    isLoading: Boolean(id) && !current?.details && !current?.error,
    error: current?.error ?? false,
    retry: () => setAttempt((n) => n + 1),
    /** Applies saved text to this row's details and the cache. */
    setDetails: (next: Partial<ApplicationDetails>) => {
      if (!id) return;
      const merged = {
        description: null,
        notes: null,
        ...(cache.get(id) ?? current?.details),
        ...next,
      };
      cache.set(id, merged);
      setState({ id, details: merged, error: false });
    },
  };
}
