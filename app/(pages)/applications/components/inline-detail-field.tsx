"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineDetailFieldProps {
  label: string;
  icon: LucideIcon;
  /** The value as the input shows it ("" for empty). */
  inputValue: string;
  /** What the panel shows when not editing; null shows a dash. */
  display: ReactNode | null;
  /** Shows the value as this link; editing then goes through Edit only. */
  href?: string;
  type?: "text" | "email" | "date" | "datetime-local";
  placeholder?: string;
  /** Turns the input text back into the stored value. */
  onChange?: (value: string) => void;
  /** Called when the user leaves the field or presses Enter. */
  onCommit?: () => void;
  className?: string;
}

/**
 * A labelled value in the detail panel that turns into an input on click,
 * like the date, platform, location and salary fields beside it.
 */
export function InlineDetailField({
  label,
  icon: Icon,
  inputValue,
  display,
  href,
  type = "text",
  placeholder,
  onChange,
  onCommit,
  className,
}: InlineDetailFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(inputValue);
  const editable = Boolean(onChange);

  const startEditing = () => {
    if (!editable) return;
    setValue(inputValue);
    setIsEditing(true);
  };
  const finish = () => {
    setIsEditing(false);
    onCommit?.();
  };

  return (
    <div className={cn("space-y-1 min-w-0", className)}>
      <span className="text-xs text-muted-foreground flex items-center justify-between font-medium">
        <span className="flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" /> {label}
        </span>
        {editable && !isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="text-muted-foreground/70 hover:text-primary transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Pencil className="h-2.5 w-2.5" /> Edit
          </button>
        )}
      </span>
      {isEditing ? (
        <Input
          type={type}
          value={value}
          aria-label={label}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e.target.value);
          }}
          onBlur={finish}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder={placeholder}
          className="h-8 text-xs bg-background"
          autoFocus
        />
      ) : href && display !== null ? (
        <a
          href={href}
          className="block font-medium text-primary text-xs sm:text-sm truncate hover:underline"
        >
          {display}
        </a>
      ) : editable ? (
        <button
          type="button"
          onClick={startEditing}
          className="block w-full text-left font-medium text-foreground text-xs sm:text-sm truncate cursor-pointer hover:text-primary transition-colors"
          title={`Click to edit ${label.toLowerCase()}`}
          aria-label={display === null ? `Add ${label.toLowerCase()}` : undefined}
        >
          {display ?? "-"}
        </button>
      ) : (
        <div className="font-medium text-foreground text-xs sm:text-sm truncate">
          {display ?? "-"}
        </div>
      )}
    </div>
  );
}
