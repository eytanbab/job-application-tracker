"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";

export interface ComboboxInputProps
  extends Omit<React.ComponentProps<"input">, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      value = "",
      onChange,
      onBlur,
      onKeyDown,
      options,
      placeholder,
      className,
      id,
      name,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState<number>(-1);
    const listboxRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const reactId = React.useId();
    const inputId = id || reactId;
    const listboxId = `${inputId}-listbox`;

    const filteredOptions = React.useMemo(() => {
      const q = (value || "").trim().toLowerCase();
      if (!q) return options;
      return options.filter((opt) => opt.toLowerCase().includes(q));
    }, [options, value]);

    // Synchronize forwarded ref and internal inputRef
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Scroll active item into view
    React.useEffect(() => {
      if (open && activeIndex >= 0 && listboxRef.current) {
        const activeElem = listboxRef.current.querySelector(
          `#${listboxId}-option-${activeIndex}`,
        );
        if (activeElem) {
          activeElem.scrollIntoView({ block: "nearest" });
        }
      }
    }, [activeIndex, open, listboxId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange?.(val);
      if (!open) setOpen(true);
    };

    const handleSelectOption = (opt: string) => {
      onChange?.(opt);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      if (disabled) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
        } else if (filteredOptions.length > 0) {
          setActiveIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(filteredOptions.length - 1);
        } else if (filteredOptions.length > 0) {
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
        }
      } else if (e.key === "Enter") {
        if (open && activeIndex >= 0 && activeIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelectOption(filteredOptions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          setActiveIndex(-1);
        }
      } else if (e.key === "Tab") {
        if (open) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }
    };

    const activeOptionId =
      open && activeIndex >= 0 && filteredOptions[activeIndex]
        ? `${listboxId}-option-${activeIndex}`
        : undefined;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative w-full flex items-center">
            <Input
              ref={inputRef}
              id={inputId}
              name={name}
              value={value}
              disabled={disabled}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (!disabled && !open) setOpen(true);
              }}
              onClick={() => {
                if (!disabled && !open) setOpen(true);
              }}
              onBlur={onBlur}
              placeholder={placeholder}
              className={cn("pr-9 cursor-text", className)}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={open ? listboxId : undefined}
              aria-activedescendant={activeOptionId}
              {...props}
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) {
                  setOpen((prev) => !prev);
                }
              }}
              aria-label={open ? "Close suggestions" : "Open suggestions"}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
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
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={placeholder || "Suggestions"}
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="w-[var(--radix-popover-trigger-width)] max-h-60 overflow-y-auto overscroll-contain p-1 rounded-xl border border-border/30 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-lg z-50 pointer-events-auto [scrollbar-width:thin]"
        >
          {filteredOptions.length === 0 ? (
            <div
              className="py-2 px-3 text-xs text-muted-foreground italic"
              role="status"
              aria-live="polite"
            >
              Custom entry: "{value}"
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected =
                (value || "").toLowerCase().trim() === opt.toLowerCase().trim();
              const isHighlighted = activeIndex === index;
              const optionId = `${listboxId}-option-${index}`;

              return (
                <div
                  key={opt}
                  id={optionId}
                  role="option"
                  aria-selected={isSelected}
                  data-highlighted={isHighlighted ? "" : undefined}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                  }}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-xs font-medium outline-none transition-colors",
                    isHighlighted
                      ? "bg-accent text-accent-foreground"
                      : isSelected
                        ? "bg-accent/50 text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
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
