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
import { format } from "date-fns";
import {
  cn,
  getStatusKind,
  statusLabels,
  statusOptions,
  safeFormatDate,
} from "@/lib/utils";
import { FormValues } from "./application-form";

interface ApplicationFormFieldsProps {
  form: UseFormReturn<FormValues>;
  isPending: boolean;
  onCancel: () => void;
}

export function ApplicationFormFields({
  form,
  isPending,
  onCancel,
}: ApplicationFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="role_name"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Role Title</FormLabel>
            <FormControl>
              <Input
                placeholder="Frontend developer"
                {...field}
                value={field.value || ""}
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
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Acme Corp"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="salary"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Salary</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. $100k - $120k"
                {...field}
                value={field.value || ""}
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
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input
                list="location-suggestions"
                placeholder="e.g. Remote / Tel Aviv"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <datalist id="location-suggestions">
              <option value="Remote" />
              <option value="Hybrid" />
              <option value="On-site" />
              <option value="Tel Aviv" />
              <option value="New York" />
              <option value="London" />
            </datalist>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="statusCategory"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Status category</FormLabel>
            <Select
              value={field.value || getStatusKind(form.getValues("status"))}
              onValueChange={(value) => {
                field.onChange(value);
                const currentStatus = form.getValues("status");
                const isDefaultOrEmpty =
                  !currentStatus ||
                  Object.values(statusLabels).some(
                    (lbl) => lbl.toLowerCase() === currentStatus.toLowerCase(),
                  );
                if (isDefaultOrEmpty) {
                  const defaultLabel =
                    statusLabels[value as keyof typeof statusLabels] || value;
                  form.setValue("status", defaultLabel);
                }
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a status" />
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
        )}
      />
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Stage details / Custom status</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Applied / Tech interview / Screening..."
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="platform"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Platform</FormLabel>
            <FormControl>
              <Input
                list="platform-suggestions"
                placeholder="e.g. LinkedIn / Indeed / Company Site"
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <datalist id="platform-suggestions">
              <option value="LinkedIn" />
              <option value="Indeed" />
              <option value="Glassdoor" />
              <option value="Greenhouse" />
              <option value="Lever" />
              <option value="Workday" />
              <option value="Company Website" />
              <option value="Other" />
            </datalist>
            <FormMessage />
          </FormItem>
        )}
      />
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
                      role="combobox"
                      variant={"outline"}
                      className={cn(
                        "group flex h-10 w-full rounded-xl border border-slate-200/90 dark:border-border/40 bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 focus:bg-white focus:border-primary/60 focus:ring-4 focus:ring-primary/15 dark:bg-muted/30 dark:hover:bg-muted/50 px-4 py-2 text-base font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-2xs transition-all duration-150",
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
                      date > new Date() || date < new Date("1900-01-01")
                    }
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          );
        }}
      />
      <FormField
        control={form.control}
        name="link"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Job posting URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://www.linkedin.com/jobs/view/123456789/"
                {...field}
                value={field.value || ""}
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
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Job Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Role responsibilities, requirements, or posting text..."
                {...field}
                value={field.value || ""}
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
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Personal Candidate Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Interview feedback, recruiter contact info, referral notes..."
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="mt-4 flex flex-col gap-2 w-full col-span-full">
        {(() => {
          const { isDirty } = form.formState;
          const isEditing = Boolean(form.getValues("id" as any));
          const isSaveDisabled = isPending || (isEditing && !isDirty);

          return (
            <Button
              type="submit"
              disabled={isSaveDisabled}
              title={
                isEditing && !isDirty ? "No changes have been made" : undefined
              }
            >
              {isPending ? (
                <Loader2 className="size-8 animate-spin" />
              ) : isEditing && !isDirty ? (
                "No Changes"
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Submit"
              )}
            </Button>
          );
        })()}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </>
  );
}
