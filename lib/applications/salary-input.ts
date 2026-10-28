import { parseSalary } from "@/lib/analytics/salary";
import { SALARY_CURRENCIES } from "@/lib/preference-options";

export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];
export type SalaryInputPeriod = "year" | "month" | "hour";

export interface SalaryParts {
  currency: SalaryCurrency;
  /** Amounts as typed, digits only; "" when empty. */
  min: string;
  max: string;
  period: SalaryInputPeriod;
}

// Each symbol is one the analytics salary parser reads back as its currency.
export const SALARY_SYMBOLS: Record<SalaryCurrency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ILS: "₪",
  INR: "₹",
  CAD: "CA$",
  AUD: "A$",
};

const PERIOD_SUFFIX: Record<SalaryInputPeriod, string> = {
  year: "",
  month: "/month",
  hour: "/hr",
};

const PER_YEAR: Record<SalaryInputPeriod, number> = { year: 1, month: 12, hour: 2080 };

export const EMPTY_SALARY: SalaryParts = { currency: "USD", min: "", max: "", period: "year" };

/** Keeps the digits of a typed amount. */
export function salaryDigits(text: string): string {
  return text.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/** The salary text stored for these parts, e.g. "$120,000 - $150,000". */
export function composeSalary(parts: SalaryParts): string {
  const amounts = [parts.min, parts.max]
    .map(salaryDigits)
    .filter(Boolean)
    .map((digits) => `${SALARY_SYMBOLS[parts.currency]}${Number(digits).toLocaleString("en-US")}`);
  if (amounts.length === 0) return "";
  const range = amounts.length === 2 && amounts[0] !== amounts[1] ? amounts.join(" - ") : amounts[0];
  return `${range}${PERIOD_SUFFIX[parts.period]}`;
}

/**
 * Splits stored salary text into amounts, only when writing them back gives
 * the same text. Anything else ("$120k + bonus") stays free text: null.
 */
export function salaryPartsFrom(
  text: string | null | undefined,
  fallbackCurrency: SalaryCurrency = "USD",
): SalaryParts | null {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { ...EMPTY_SALARY, currency: fallbackCurrency };
  const parsed = parseSalary(trimmed);
  if (!parsed.ok || !(parsed.period in PER_YEAR)) return null;
  const currency = (parsed.currency ?? fallbackCurrency) as SalaryCurrency;
  if (!SALARY_CURRENCIES.includes(currency)) return null;
  const period = parsed.period as SalaryInputPeriod;
  const perPeriod = (annual: number) => String(Math.round(annual / PER_YEAR[period]));
  const parts: SalaryParts = {
    currency,
    min: perPeriod(parsed.min),
    max: parsed.max === parsed.min ? "" : perPeriod(parsed.max),
    period,
  };
  return composeSalary(parts) === trimmed ? parts : null;
}
