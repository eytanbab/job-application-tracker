import { quantile } from "./stats";
import type { AppFacts } from "./types";

export type SalaryPeriod = "hour" | "day" | "week" | "month" | "year";

export type ParsedSalary =
  | {
      ok: true;
      /** ISO 4217 code, or null when the text names no currency. */
      currency: string | null;
      period: SalaryPeriod;
      /** Annualized bounds. */
      min: number;
      max: number;
      annualMid: number;
    }
  | { ok: false; reason: "empty" | "no-number" | "ambiguous" | "out-of-range" };

const PERIOD_MULTIPLIER: Record<SalaryPeriod, number> = {
  hour: 2080,
  day: 260,
  week: 52,
  month: 12,
  year: 1,
};

// Checked in order: multi-character symbols before "$".
const CURRENCY_PATTERNS: [RegExp, string][] = [
  [/\b(?:ca\$|c\$|cad)/, "CAD"],
  [/\b(?:a\$|au\$|aud)/, "AUD"],
  [/€|\beur\b|\beuros?\b/, "EUR"],
  [/£|\bgbp\b/, "GBP"],
  [/₪|\bils\b|\bnis\b|\bshekels?\b/, "ILS"],
  [/₹|\binr\b|\blpa\b|\blakhs?\b|\brupees?\b/, "INR"],
  [/\$|\busd\b/, "USD"],
];

const PERIOD_PATTERNS: [RegExp, SalaryPeriod][] = [
  [/\/\s*h(?:r|our)?\b|\bper\s+hour\b|\bhourly\b|\ban\s+hour\b|\bp\/?h\b/, "hour"],
  [/\/\s*day\b|\bper\s+day\b|\bdaily\b|\ba\s+day\b/, "day"],
  [/\/\s*w(?:k|eek)\b|\bper\s+week\b|\bweekly\b/, "week"],
  [/\/\s*mo(?:nth)?\b|\bper\s+month\b|\bmonthly\b|\ba\s+month\b|\bpcm\b|\bp\/m\b/, "month"],
];

// Segments that describe extras rather than base pay.
const EXTRAS =
  /\b(?:bonus|equity|rsus?|stock|options|sign[\s-]?on|signing|commission|benefits?|401\s*\(?k\)?|pto|vacation|holidays?|days?\s+off)\b|\b(?:days?|hours?|hrs?)\s*(?:\/|per\b|a\b)\s*(?:week|wk)\b/;

const MIN_ANNUAL = 1_000;
const MAX_ANNUAL = 100_000_000;

function detectCurrency(text: string): string | null {
  for (const [pattern, code] of CURRENCY_PATTERNS) {
    if (pattern.test(text)) return code;
  }
  return null;
}

function detectPeriod(text: string): SalaryPeriod {
  for (const [pattern, period] of PERIOD_PATTERNS) {
    if (pattern.test(text)) return period;
  }
  return "year";
}

/** Keeps only the base-pay part: drops "+ bonus", "15%", "401k" and similar. */
function basePayText(text: string): string {
  let t = text;
  // "120,000" -> "120000" so commas left over are separators.
  while (/(\d),(\d{3})\b/.test(t)) t = t.replace(/(\d),(\d{3})\b/g, "$1$2");
  t = t.replace(/401\s*\(?k\)?/g, " ");
  t = t.replace(/\d+(?:\.\d+)?\s*%/g, " ");
  const [beforePlus] = t.split("+");
  return beforePlus
    .split(/[;,]|\band\b|\bplus\b/)
    .filter((segment) => !EXTRAS.test(segment))
    .join(" ");
}

const NUMBER = /(\d+(?:\.\d+)?)\s*(k|m|mm|lakhs?|lpa|l)?\b/g;

function suffixMultiplier(suffix: string | undefined): number {
  switch (suffix) {
    case "k":
      return 1_000;
    case "m":
    case "mm":
      return 1_000_000;
    case "l":
    case "lpa":
    case "lakh":
    case "lakhs":
      return 100_000;
    default:
      return 1;
  }
}

/** Parses free-text salary into an annual range. Never guesses: unclear text is excluded. */
export function parseSalary(raw: string | null | undefined): ParsedSalary {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) return { ok: false, reason: "empty" };

  const currency = detectCurrency(text);
  const base = basePayText(text);
  const period = detectPeriod(base);

  const matches = [...base.matchAll(NUMBER)].slice(0, 2);
  if (matches.length === 0) return { ok: false, reason: "no-number" };

  // In "120-150k" the suffix on the upper bound applies to both ends.
  const lastSuffix = matches[matches.length - 1][2];
  const values = matches.map(([, num, suffix], i) => {
    const isLowerBound = i === 0 && matches.length === 2;
    const multiplier = suffixMultiplier(suffix ?? (isLowerBound ? lastSuffix : undefined));
    return parseFloat(num) * multiplier;
  });

  const hasSuffix = matches.some(([, , suffix]) => suffix);
  if (period === "year" && !hasSuffix && values.every((v) => v < 1_000)) {
    // "120 - 150" could be thousands, hourly or monthly.
    return { ok: false, reason: "ambiguous" };
  }

  const annual = values.map((v) => v * PERIOD_MULTIPLIER[period]);
  const min = Math.min(...annual);
  const max = Math.max(...annual);
  if (min < MIN_ANNUAL || max > MAX_ANNUAL) {
    return { ok: false, reason: "out-of-range" };
  }

  return { ok: true, currency, period, min, max, annualMid: (min + max) / 2 };
}

export interface SalarySummary {
  /** Currency the figures are in, or null when no application named one. */
  currency: string | null;
  /** Applications whose salary was parsed and is in `currency`. */
  statedCount: number;
  /** Applications in the period with any salary text. */
  withTextCount: number;
  /** Salary text that could not be read reliably. */
  excludedCount: number;
  /** Parsed, but in another currency. */
  otherCurrencyCount: number;
  totalCount: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  highest: { role: string; company: string; raw: string; annualMid: number } | null;
}

/**
 * Summarizes salaries in one currency: the user's preference if set,
 * otherwise the most common one in the data. Figures without a currency are
 * included only when no other currency appears.
 */
export function summarizeSalaries(
  facts: readonly AppFacts[],
  preferredCurrency?: string | null,
): SalarySummary {
  const parsed: { fact: AppFacts; salary: Extract<ParsedSalary, { ok: true }> }[] = [];
  let withTextCount = 0;
  let excludedCount = 0;

  for (const fact of facts) {
    if (!fact.app.salary?.trim()) continue;
    withTextCount++;
    const salary = parseSalary(fact.app.salary);
    if (salary.ok) parsed.push({ fact, salary });
    else excludedCount++;
  }

  const currencyCounts = new Map<string, number>();
  for (const { salary } of parsed) {
    if (salary.currency) {
      currencyCounts.set(salary.currency, (currencyCounts.get(salary.currency) ?? 0) + 1);
    }
  }
  const mostCommon =
    [...currencyCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const currency = preferredCurrency ?? mostCommon;
  // Figures with no currency are assumed to share the data's only currency.
  const onlyOneCurrency =
    currencyCounts.size === 0 ||
    (currencyCounts.size === 1 && currencyCounts.has(currency ?? ""));

  const included = parsed.filter(({ salary }) =>
    salary.currency === null ? onlyOneCurrency : salary.currency === currency,
  );
  const values = included.map(({ salary }) => salary.annualMid);
  const top = [...included].sort((a, b) => b.salary.annualMid - a.salary.annualMid)[0];

  return {
    currency,
    statedCount: included.length,
    withTextCount,
    excludedCount,
    otherCurrencyCount: parsed.length - included.length,
    totalCount: facts.length,
    median: quantile(values, 0.5),
    p25: quantile(values, 0.25),
    p75: quantile(values, 0.75),
    highest: top
      ? {
          role: top.fact.app.role,
          company: top.fact.app.company,
          raw: top.fact.app.salary ?? "",
          annualMid: top.salary.annualMid,
        }
      : null,
  };
}

/** "$135K", "₪300K"; plain "135K" when the currency is unknown. */
export function formatSalary(value: number | null, currency: string | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    ...(currency ? { style: "currency" as const, currency } : {}),
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}
