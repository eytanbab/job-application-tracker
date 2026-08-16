"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, endOfDay } from "date-fns";
import {
  cn,
  getStatusKind,
  statusLabels,
  statusOptions,
  safeFormatDate,
  locationOptions,
  platformOptions,
  mergeWithDefaultOptions,
  isStandardStatus,
} from "@/lib/utils";
import { useMemo, useState } from "react";
import { FormValues } from "./application-form";
import { ComboboxInput } from "@/components/ui/combobox-input";

const DEFAULT_EMPTY_ARRAY: string[] = [];

interface ApplicationFormFieldsProps {
  form: UseFormReturn<FormValues>;
  isPending: boolean;
  onCancel: () => void;
  userLocations?: string[];
  userPlatforms?: string[];
}

function StatusFormFields({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-3">
      <FormField
        control={form.control}
        name="statusCategory"
        render={({ field }) => {
          const currentStatus = form.watch("status") || "";
          return (
            <FormItem className="space-y-0">
              <FormLabel>
                Status Category
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <Select
                value={field.value || getStatusKind(currentStatus)}
                onValueChange={(value) => {
                  field.onChange(value);
                  const defaultLabel =
                    statusLabels[value as keyof typeof statusLabels] || "";
                  const prevStatus = form.getValues("status");
                  if (!prevStatus || isStandardStatus(prevStatus)) {
                    form.setValue("status", defaultLabel || prevStatus, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field: statusField }) => (
          <FormItem className="space-y-0">
            <FormLabel>Stage Details / Custom Status</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Technical Interview / Phone Screen..."
                {...statusField}
                value={statusField.value || ""}
                className="h-9 text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function DateAppliedFormField({ form }: { form: UseFormReturn<FormValues> }) {
  return (
    <FormField
      control={form.control}
      name="date_applied"
      render={({ field }) => {
        const selectedDate = (() => {
          if (!field.value) return undefined;
          if ((field.value as unknown) instanceof Date) {
            const d = field.value as unknown as Date;
            return isNaN(d.getTime()) ? undefined : d;
          }
          const str = String(field.value).trim();
          if (!str) return undefined;
          const isoStr = str.includes("T") ? str : `${str}T12:00:00`;
          const d = new Date(isoStr);
          return isNaN(d.getTime()) ? undefined : d;
        })();

        return (
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Date applied</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "group flex h-10 w-full rounded-xl border border-slate-200/90 dark:border-border/40 bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 dark:hover:border-border/80 focus:bg-white dark:focus:bg-card focus:border-primary/60 focus:ring-4 focus:ring-primary/15 dark:bg-muted/30 dark:hover:bg-muted/50 px-4 py-2 text-base font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-2xs transition-all duration-150",
                      !field.value && "text-muted-foreground/70",
                    )}
                  >
                    {field.value ? (
                      safeFormatDate(field.value, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  showYearSwitcher={false}
                  selected={selectedDate}
                  onSelect={field.onChange}
                  disabled={(date: Date) =>
                    date > endOfDay(new Date()) || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export function ApplicationFormFields({
  form,
  isPending,
  onCancel,
  userLocations = DEFAULT_EMPTY_ARRAY,
  userPlatforms = DEFAULT_EMPTY_ARRAY,
}: ApplicationFormFieldsProps) {
  const mergedLocations = useMemo(
    () => mergeWithDefaultOptions(userLocations, locationOptions),
    [userLocations],
  );
  const mergedPlatforms = useMemo(
    () => mergeWithDefaultOptions(userPlatforms, platformOptions),
    [userPlatforms],
  );

  const isEditing = Boolean(form.getValues("id" as any));
  const hasOptionalData = Boolean(
    form.watch("salary") ||
      form.watch("link") ||
      form.watch("description") ||
      form.watch("notes"),
  );

  const [showMoreDetails, setShowMoreDetails] = useState(
    isEditing || hasOptionalData,
  );

  return (
    <>
      {/* 1. Essential Fields */}
      <FormField
        control={form.control}
        name="role_name"
        render={({ field }) => (
          <FormItem className="space-y-1 col-span-full sm:col-span-1">
            <FormLabel className="text-xs font-semibold">
              Role Title
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="Frontend Developer"
                {...field}
                value={field.value || ""}
                className="h-9 text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="company_name"
        render={({ field }) => (
          <FormItem className="space-y-1 col-span-full sm:col-span-1">
            <FormLabel className="text-xs font-semibold">
              Company Name
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Acme Corp"
                {...field}
                value={field.value || ""}
                className="h-9 text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <StatusFormFields form={form} />

      <FormField
        control={form.control}
        name="platform"
        render={({ field }) => (
          <FormItem className="space-y-1 col-span-full sm:col-span-1">
            <FormLabel className="text-xs font-semibold">
              Platform
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <ComboboxInput
                {...field}
                options={mergedPlatforms}
                placeholder="e.g. LinkedIn / Indeed"
                value={field.value || ""}
                onChange={(val) => field.onChange(val)}
                onBlur={field.onBlur}
                className="h-9 text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem className="space-y-1 col-span-full sm:col-span-1">
            <FormLabel className="text-xs font-semibold">
              Location
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <FormControl>
              <ComboboxInput
                {...field}
                options={mergedLocations}
                placeholder="e.g. Remote / New York"
                value={field.value || ""}
                onChange={(val) => field.onChange(val)}
                onBlur={field.onBlur}
                className="h-9 text-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <DateAppliedFormField form={form} />

      {/* 2. Collapsible Progressive Disclosure for Optional Fields */}
      <div className="col-span-full pt-1">
        {!showMoreDetails ? (
          <button
            type="button"
            onClick={() => setShowMoreDetails(true)}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 py-1 cursor-pointer"
          >
            <span>+ Add More Details (Salary, URL, Description, Notes)</span>
          </button>
        ) : (
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Additional Details
              </span>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setShowMoreDetails(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Hide
                </button>
              )}
            </div>

            <FormField
              control={form.control}
              name="salary"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Salary (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. $100k - $120k"
                      {...field}
                      value={field.value || ""}
                      className="h-9 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Job Posting URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://www.linkedin.com/jobs/view/..."
                      {...field}
                      value={field.value || ""}
                      className="h-9 text-xs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Job Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Role responsibilities, requirements, or posting text..."
                      {...field}
                      value={field.value || ""}
                      className="text-xs min-h-[70px] max-h-40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-semibold">Personal Candidate Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Interview feedback, recruiter contact info, referral notes..."
                      {...field}
                      value={field.value || ""}
                      className="text-xs min-h-[70px] max-h-40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>

      {/* 3. Submit / Cancel Action Buttons */}
      <div className="mt-3 flex flex-col gap-2 w-full col-span-full pt-2">
        {(() => {
          const { isDirty } = form.formState;
          const isEditingApp = Boolean(form.getValues("id" as any));
          const isSaveDisabled = isPending || (isEditingApp && !isDirty);

          return (
            <Button
              type="submit"
              disabled={isSaveDisabled}
              className="h-10 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              title={
                isEditingApp && !isDirty ? "No changes have been made" : undefined
              }
            >
              {isPending ? (
                <Loader2 className="size-5 animate-spin" />
              ) : isEditingApp && !isDirty ? (
                "No Changes"
              ) : isEditingApp ? (
                "Save Changes"
              ) : (
                "Add Application"
              )}
            </Button>
          );
        })()}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="h-10 text-xs rounded-xl cursor-pointer"
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
