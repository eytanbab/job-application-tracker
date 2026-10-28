"use client";

import { useEffect, useRef, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SALARY_CURRENCIES } from "@/lib/preference-options";
import {
  composeSalary,
  EMPTY_SALARY,
  SALARY_SYMBOLS,
  salaryDigits,
  salaryPartsFrom,
  type SalaryCurrency,
  type SalaryInputPeriod,
  type SalaryParts,
} from "@/lib/applications/salary-input";
import type { FormValues } from "./application-form";

const PERIOD_LABELS: Record<SalaryInputPeriod, string> = {
  year: "per year",
  month: "per month",
  hour: "per hour",
};

/**
 * Salary as currency, minimum, maximum and period, stored as the text the
 * analytics page reads ("$120,000 - $150,000"). Text that doesn't fit that
 * shape, such as "$120k + bonus", stays editable as free text.
 */
export function SalaryFormField({ form }: { form: UseFormReturn<FormValues> }) {
  const value = form.watch("salary") ?? "";
  const [parts, setParts] = useState<SalaryParts | null>(() => salaryPartsFrom(value));
  // The text this field wrote last, to tell its own changes from autofill.
  const writtenRef = useRef(value);

  useEffect(() => {
    if (value === writtenRef.current) return;
    writtenRef.current = value;
    setParts(salaryPartsFrom(value, parts?.currency));
  }, [value, parts?.currency]);

  const write = (next: SalaryParts) => {
    setParts(next);
    const text = composeSalary(next);
    writtenRef.current = text;
    form.setValue("salary", text, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <FormField
      control={form.control}
      name="salary"
      render={({ field }) => (
        <FormItem className="space-y-1">
          <div className="flex items-center justify-between">
            <FormLabel className="text-xs font-semibold">Salary</FormLabel>
            <button
              type="button"
              onClick={() => {
                if (parts) {
                  setParts(null);
                } else {
                  write(salaryPartsFrom(value) ?? { ...EMPTY_SALARY });
                }
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {parts ? "Type it instead" : "Use amounts"}
            </button>
          </div>
          {parts ? (
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Select
                value={parts.currency}
                onValueChange={(currency) =>
                  write({ ...parts, currency: currency as SalaryCurrency })
                }
              >
                <SelectTrigger aria-label="Currency" className="h-9 w-[88px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code} className="text-xs">
                      {SALARY_SYMBOLS[code]} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                aria-label="Minimum salary"
                inputMode="numeric"
                placeholder="Min"
                value={parts.min ? Number(parts.min).toLocaleString("en-US") : ""}
                onChange={(e) => write({ ...parts, min: salaryDigits(e.target.value) })}
                onBlur={field.onBlur}
                className="h-9 min-w-0 flex-1"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                aria-label="Maximum salary"
                inputMode="numeric"
                placeholder="Max"
                value={parts.max ? Number(parts.max).toLocaleString("en-US") : ""}
                onChange={(e) => write({ ...parts, max: salaryDigits(e.target.value) })}
                onBlur={field.onBlur}
                className="h-9 min-w-0 flex-1"
              />
              <Select
                value={parts.period}
                onValueChange={(period) =>
                  write({ ...parts, period: period as SalaryInputPeriod })
                }
              >
                <SelectTrigger aria-label="Pay period" className="h-9 w-[112px] shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PERIOD_LABELS) as SalaryInputPeriod[]).map((period) => (
                    <SelectItem key={period} value={period} className="text-xs">
                      {PERIOD_LABELS[period]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <FormControl>
              <Input
                placeholder="e.g. $120k + bonus"
                {...field}
                value={field.value || ""}
                onChange={(e) => {
                  writtenRef.current = e.target.value;
                  field.onChange(e.target.value);
                }}
                className="h-9"
              />
            </FormControl>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
