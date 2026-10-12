"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "checked"
  > {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current!);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = checked === "indeterminate";
      }
    }, [checked]);

    const isChecked = checked === true;
    const isIndeterminate = checked === "indeterminate";

    return (
      <label
        className={cn(
          "relative inline-flex items-center justify-center h-4 w-4 shrink-0 rounded-[4px] border border-primary/60 transition-all duration-150 select-none cursor-pointer focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-1 focus-within:ring-offset-background",
          isChecked || isIndeterminate
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background hover:bg-accent/40 border-border/70",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <input
          type="checkbox"
          ref={innerRef}
          checked={isChecked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 m-0 p-0"
          {...props}
        />
        {isChecked && <Check className="h-3 w-3 stroke-[3] pointer-events-none" />}
        {isIndeterminate && <Minus className="h-3 w-3 stroke-[3] pointer-events-none" />}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
