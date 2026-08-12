"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  cn,
  locationOptions,
  platformOptions,
  mergeWithDefaultOptions,
} from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

export { locationOptions, platformOptions, mergeWithDefaultOptions };

export interface ComboboxInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  options: string[];
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      options,
      placeholder,
      className,
      id,
      name,
      disabled,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const filteredOptions = React.useMemo(() => {
      const q = (value || "").trim().toLowerCase();
      if (!q) return options;
      return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange?.(val);
      if (!open) setOpen(true);
    };

    const handleSelectOption = (opt: string) => {
      onChange?.(opt);
      setOpen(false);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div ref={containerRef} className="relative w-full flex items-center">
            <Input
              ref={ref}
              id={id}
              name={name}
              value={value}
              disabled={disabled}
              onChange={handleInputChange}
              onFocus={() => {
                if (!disabled) setOpen(true);
              }}
              onClick={() => {
                if (!disabled) setOpen(true);
              }}
              onBlur={onBlur}
              placeholder={placeholder}
              className={cn("pr-9 cursor-text", className)}
              autoComplete="off"
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) setOpen((prev) => !prev);
              }}
              aria-label="Toggle options"
              className="absolute right-3 flex items-center justify-center text-muted-foreground hover:text-foreground transition-transform duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 opacity-50 transition-transform duration-200",
                  open && "rotate-180 opacity-100",
                )}
              />
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto overscroll-contain p-1 rounded-xl border border-border/30 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-lg z-50 pointer-events-auto [scrollbar-width:thin]"
        >
          {filteredOptions.length === 0 ? (
            <div className="py-2 px-3 text-xs text-muted-foreground italic">
              Custom entry: "{value}"
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected =
                (value || "").toLowerCase().trim() === opt.toLowerCase().trim();
              return (
                <div
                  key={opt}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectOption(opt);
                    }
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-xs font-medium outline-none hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected && "bg-accent/50 text-accent-foreground",
                  )}
                >
                  {isSelected && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </span>
                  )}
                  {opt}
                </div>
              );
            })
          )}
        </PopoverContent>
      </Popover>
    );
  },
);

ComboboxInput.displayName = "ComboboxInput";
