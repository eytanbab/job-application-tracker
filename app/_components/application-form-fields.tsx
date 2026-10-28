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
import { addWeeks, format, endOfDay, subDays } from "date-fns";
import {
  cn,
  getStatusKind,
  statusLabels,
  statusOptions,
  safeFormatDate,
  locationOptions,
  platformOptions,
  formatPlatformLabel,
  mergeWithDefaultOptions,
  isStandardStatus,
  StatusKind,
} from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { FormValues } from "./application-form";
import { ComboboxInput } from "@/components/ui/combobox-input";
import { ResumePicker } from "./resume-picker";

const DEFAULT_EMPTY_ARRAY: string[] = [];

interface ApplicationFormFieldsProps {
  form: UseFormReturn<FormValues>;
  isPending: boolean;
  userLocations?: string[];
  userPlatforms?: string[];
  onUploadingResumeChange?: (isUploading: boolean) => void;
  onDocumentUploaded?: (docId: string) => void;
}

function StatusFormFields({ form }: { form: UseFormReturn<FormValues> }) {
  const currentStatus = form.watch("status") || "";
  const currentCategory =
    form.watch("statusCategory") || getStatusKind(currentStatus);

  const initialHasCustom = useMemo(() => {
    const rawStatus = form.getValues("status");
    return Boolean(rawStatus && !isStandardStatus(rawStatus));
  }, [form]);

  const [showCustomStage, setShowCustomStage] = useState(initialHasCustom);

  return (
    <div className="col-span-full space-y-1.5">
      <div
        className={cn(
          "grid gap-3 transition-all",
          showCustomStage ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {/* Primary Status / Pipeline Category Field */}
        <FormField
          control={form.control}
          name="statusCategory"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold">
                Status / Pipeline Stage
                <span className="text-destructive ml-1">*</span>
              </FormLabel>
              <Select
                value={field.value || getStatusKind(currentStatus)}
                onValueChange={(value) => {
                  field.onChange(value);
                  const nextCategory = value as StatusKind;
                  const defaultLabel =
                    statusLabels[nextCategory] || "";
                  const prevStatus = form.getValues("status");
                  const prevCat = getStatusKind(prevStatus, field.value);

                  // Sending a saved job: it was applied to today, not on
                  // the day it was saved. The date stays editable.
                  if (prevCat === "saved" && nextCategory !== "saved") {
                    form.setValue("date_applied", format(new Date(), "yyyy-MM-dd"), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }

                  if (
                    prevCat !== nextCategory ||
                    !showCustomStage ||
                    !prevStatus ||
                    isStandardStatus(prevStatus)
                  ) {
                    form.setValue("status", defaultLabel, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (prevCat !== nextCategory) {
                      setShowCustomStage(false);
                    }
                  }
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full h-9 text-base md:text-sm font-normal">
                    <SelectValue placeholder="Select status category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem
                      key={status.value}
                      value={status.value}
                      className="text-xs capitalize cursor-pointer"
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Optional Custom Stage Name Input */}
        {showCustomStage && (
          <FormField
            control={form.control}
            name="status"
            render={({ field: statusField }) => (
              <FormItem className="space-y-1">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-xs font-semibold">
                    Custom Stage Name
                  </FormLabel>
                  <button
                    type="button"
                    onClick={() => {
                      const categoryLabel =
                        statusLabels[
                          currentCategory as keyof typeof statusLabels
                        ] || "Applied";
                      form.setValue("status", categoryLabel, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setShowCustomStage(false);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Use standard only
                  </button>
                </div>
                <FormControl>
                  <Input
                    placeholder={
                      statusLabels[
                        currentCategory as keyof typeof statusLabels
                      ]
                        ? `e.g. ${statusLabels[currentCategory as keyof typeof statusLabels]} - Round 2`
                        : "e.g. Round 2 Technical Interview"
                    }
                    value={
                      statusField.value && !isStandardStatus(statusField.value)
                        ? statusField.value
                        : ""
                    }
                    onChange={(e) => {
                      statusField.onChange(e.target.value);
                    }}
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      {/* Progressive Disclosure Toggle when custom stage is hidden */}
      {!showCustomStage && (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => {
            setShowCustomStage(true);
          }}
          className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
        >
          <span>+ Add custom stage name (e.g. Round 2 Technical)</span>
        </button>
      )}
    </div>
  );
}

function DateAppliedFormField({ form }: { form: UseFormReturn<FormValues> }) {
  const [isOpen, setIsOpen] = useState(false);
  const isSaved = form.watch("statusCategory") === "saved";

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

        // Picking a date (or a preset) commits it and closes the picker.
        // Clicking the already-selected day yields undefined; ignore it so
        // the required date can't be cleared by accident.
        const selectDate = (date: Date | undefined) => {
          if (!date) return;
          field.onChange(date);
          setIsOpen(false);
        };

        return (
          <FormItem className="space-y-1 col-span-full">
            <FormLabel className="text-xs font-semibold">
              {isSaved ? "Date Saved" : "Date Applied"}
              <span className="text-destructive ml-1">*</span>
            </FormLabel>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-9 justify-start text-left text-base md:text-sm font-normal rounded-xl bg-slate-100/80 hover:bg-slate-100 dark:bg-muted/30 dark:hover:bg-muted/50 px-3 border-input cursor-pointer aria-[invalid=true]:border-destructive",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {field.value ? (
                      <span>{safeFormatDate(field.value, "PPP")}</span>
                    ) : (
                      <span className="text-muted-foreground">Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex items-center gap-1.5 pb-2 mb-1 border-b border-border/50">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    onClick={() => selectDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    onClick={() => selectDate(subDays(new Date(), 1))}
                  >
                    Yesterday
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-lg cursor-pointer"
                    onClick={() => selectDate(subDays(new Date(), 7))}
                  >
                    1 week ago
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  showYearSwitcher={true}
                  selected={selectedDate}
                  onSelect={selectDate}
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

/** `<input type="datetime-local">` text for a stored instant, in local time. */
function toLocalInputValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd'T'HH:mm");
}

function PlanningFormFields({ form }: { form: UseFormReturn<FormValues> }) {
  const isInterview = form.watch("statusCategory") === "interview";
  const hasInterview = Boolean(form.watch("interviewAt"));
  const setFollowUp = (date: Date) =>
    form.setValue("followUpDate", format(date, "yyyy-MM-dd"), {
      shouldDirty: true,
      shouldValidate: true,
    });

  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Next Steps & Contacts
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="followUpDate"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <FormLabel className="text-xs font-semibold">Follow Up On</FormLabel>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowUp(addWeeks(new Date(), 1))}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    In 1 week
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowUp(addWeeks(new Date(), 2))}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    In 2 weeks
                  </button>
                </div>
              </div>
              <FormControl>
                <Input
                  type="date"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  className="h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(isInterview || hasInterview) && (
          <FormField
            control={form.control}
            name="interviewAt"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-semibold">Next Interview</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={toLocalInputValue(field.value)}
                    onChange={(e) =>
                      field.onChange(e.target.value ? new Date(e.target.value) : null)
                    }
                    className="h-9"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold">Contact Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Dana Levi, recruiter"
                  {...field}
                  value={field.value || ""}
                  className="h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs font-semibold">Contact Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="e.g. dana@acme.com"
                  {...field}
                  value={field.value || ""}
                  className="h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="referredBy"
          render={({ field }) => (
            <FormItem className="space-y-1 sm:col-span-2">
              <FormLabel className="text-xs font-semibold">Referred By</FormLabel>
              <FormControl>
                <Input
                  placeholder="Leave empty if you applied without a referral"
                  {...field}
                  value={field.value || ""}
                  className="h-9"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export function ApplicationFormFields({
  form,
  isPending,
  userLocations = DEFAULT_EMPTY_ARRAY,
  userPlatforms = DEFAULT_EMPTY_ARRAY,
  onUploadingResumeChange,
  onDocumentUploaded,
}: ApplicationFormFieldsProps) {
  const mergedLocations = useMemo(
    () => mergeWithDefaultOptions(userLocations, locationOptions),
    [userLocations],
  );
  const mergedPlatforms = useMemo(
    () =>
      mergeWithDefaultOptions(
        userPlatforms.map(formatPlatformLabel),
        platformOptions,
      ),
    [userPlatforms],
  );

  const isEditing = Boolean(form.getValues("id" as any));
  const hasOptionalData = Boolean(
    form.watch("salary") ||
      form.watch("link") ||
      form.watch("description") ||
      form.watch("notes") ||
      form.watch("resumeId") ||
      form.watch("followUpDate") ||
      form.watch("interviewAt") ||
      form.watch("contactName") ||
      form.watch("contactEmail") ||
      form.watch("referredBy"),
  );

  const [showMoreDetails, setShowMoreDetails] = useState(
    isEditing || hasOptionalData,
  );

  useEffect(() => {
    if (hasOptionalData) {
      setShowMoreDetails(true);
    }
  }, [hasOptionalData]);

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
                placeholder="e.g. Frontend Developer"
                {...field}
                value={field.value || ""}
                className="h-9"
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
                className="h-9"
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
                className="h-9"
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
                className="h-9"
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
            <span>+ Add More Details (Resume, Salary, URL, Description, Notes)</span>
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

            <ResumePicker
              form={form}
              disabled={isPending}
              onUploadingChange={onUploadingResumeChange}
              onDocumentUploaded={onDocumentUploaded}
            />

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
                      className="h-9"
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
                      className="h-9"
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
                      className="min-h-[70px] max-h-40"
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
                      placeholder="Interview feedback, questions to ask, anything else to remember..."
                      {...field}
                      value={field.value || ""}
                      className="min-h-[70px] max-h-40"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <PlanningFormFields form={form} />
          </div>
        )}
      </div>

    </>
  );
}
