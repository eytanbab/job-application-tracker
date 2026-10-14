"use client";

import { BarChart3, Briefcase, LayoutGrid, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const HIGHLIGHTS = [
  { icon: Link2, text: "Paste a job link and the details fill themselves in" },
  { icon: LayoutGrid, text: "Move applications across a board as they progress" },
  { icon: BarChart3, text: "See which platforms actually get you replies" },
];

/**
 * First-run state for an account with no applications: explains what the
 * tracker does and offers the first action, instead of an empty table with
 * zero-count filters.
 */
export function ApplicationsEmptyState({
  onOpenCreate,
}: {
  onOpenCreate: () => void;
}) {
  return (
    <section
      aria-labelledby="applications-empty-title"
      className="rounded-xl border border-dashed border-border/70 bg-card px-6 py-12 sm:py-16 text-center shadow-2xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Briefcase className="h-6 w-6" />
      </div>
      <h2
        id="applications-empty-title"
        className="mt-4 text-lg sm:text-xl font-bold tracking-tight text-foreground font-heading"
      >
        Track your first application
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Paste a link to a job posting and we&apos;ll fill in the role, company
        and location for you, or enter the details yourself.
      </p>
      <Button onClick={onOpenCreate} className="mt-6 h-10 px-5">
        <Plus className="h-4 w-4" />
        Add an application
      </Button>
      <ul className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-start gap-2.5 text-xs text-muted-foreground"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
