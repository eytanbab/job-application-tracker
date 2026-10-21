import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** One titled section of the analytics page (h2 + optional description). */
export function AnalyticsSection({
  id,
  title,
  description,
  aside,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-3 min-w-0", className)}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
        <div className="min-w-0">
          <h2 id={id} className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Card surface used by every analytics panel. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card shadow-2xs p-4 sm:p-5 min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground">{children}</h3>;
}
