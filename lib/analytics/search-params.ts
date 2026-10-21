import { createLoader, parseAsString, parseAsStringLiteral } from "nuqs/server";
import { RANGE_PRESETS, resolveRange, type ResolvedRange } from "./range";

export const DEFAULT_RANGE = "90d" as const;

/**
 * URL search params of /analytics. The page reads them on the server; the
 * period picker writes them with the same parsers.
 */
export const analyticsSearchParams = {
  range: parseAsStringLiteral(RANGE_PRESETS).withDefault(DEFAULT_RANGE),
  // Validated by resolveRange; invalid dates fall back to all time.
  from: parseAsString,
  to: parseAsString,
};

export const loadAnalyticsSearchParams = createLoader(analyticsSearchParams);

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

/** Query string for a resolved range, without the default preset. */
export function rangeQuery(resolved: ResolvedRange): string {
  const params = new URLSearchParams();
  if (resolved.preset === "custom") {
    params.set("range", "custom");
    if (resolved.current.from) params.set("from", resolved.current.from);
    if (resolved.current.to) params.set("to", resolved.current.to);
  } else if (resolved.preset !== DEFAULT_RANGE) {
    params.set("range", resolved.preset);
  }
  return params.toString();
}

/**
 * Where an old `?month=&year=` link should go, or null when the URL already
 * uses the period params.
 */
export function legacyRangeRedirect(searchParams: RawParams, today: Date): string | null {
  const month = first(searchParams.month);
  const year = first(searchParams.year);
  if (!month && !year) return null;
  const query = rangeQuery(resolveRange({ month, year }, today));
  return `/analytics/overview${query ? `?${query}` : ""}`;
}

/** Overview URL that keeps the period from the current search params. */
export function overviewHref(searchParams: RawParams, today: Date): string {
  const legacy = legacyRangeRedirect(searchParams, today);
  if (legacy) return legacy;
  const params = new URLSearchParams();
  for (const key of ["range", "from", "to"] as const) {
    const value = first(searchParams[key]);
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/analytics/overview${query ? `?${query}` : ""}`;
}
