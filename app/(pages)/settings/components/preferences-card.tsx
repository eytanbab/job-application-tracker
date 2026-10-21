"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSalaryCurrency, updateWeeklyGoal } from "@/app/actions/preferences";
import { SALARY_CURRENCIES, type UserPreferences } from "@/lib/preference-options";

const AUTO = "auto";

export function PreferencesCard({ preferences }: { preferences: UserPreferences }) {
  const [goal, setGoal] = useState(preferences.weeklyApplicationGoal?.toString() ?? "");
  const [currency, setCurrency] = useState(preferences.salaryCurrency ?? AUTO);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const goalValue = goal.trim() === "" ? null : Number(goal);
      const [goalResult, currencyResult] = await Promise.all([
        updateWeeklyGoal(goalValue),
        updateSalaryCurrency(currency === AUTO ? null : currency),
      ]);
      const failed = [goalResult, currencyResult].find((r) => !r.ok);
      setMessage(
        failed && !failed.ok
          ? { tone: "error", text: failed.error }
          : { tone: "ok", text: "Preferences saved." },
      );
    });
  };

  return (
    <Card className="gap-4 rounded-xl border-border/30 p-5">
      <CardHeader>
        <CardTitle className="text-base">Analytics preferences</CardTitle>
        <CardDescription>Set a weekly target and the currency salaries are shown in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pref-goal" className="text-sm font-medium text-foreground">
                Weekly application goal
              </label>
              <Input
                id="pref-goal"
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                placeholder="No goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave empty for no goal.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label id="pref-currency-label" className="text-sm font-medium text-foreground">
                Salary currency
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger aria-labelledby="pref-currency-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>Most common in my applications</SelectItem>
                  {SALARY_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Salaries in other currencies are left out of the summary.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save preferences"}
            </Button>
            <p
              role="status"
              className={message?.tone === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
            >
              {message?.text}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
