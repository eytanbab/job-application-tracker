import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-slate-200/90 dark:border-border/40 bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 dark:bg-muted/30 dark:hover:bg-muted/50 dark:focus:bg-muted/60 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:border-primary/60 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-2xs text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
