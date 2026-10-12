import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex h-40 w-full resize-none rounded-xl border border-input bg-slate-100/80 hover:bg-slate-100 dark:bg-muted/30 dark:hover:bg-muted/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground/70 focus-visible:bg-white dark:focus-visible:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary/60 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-2xs text-foreground aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
