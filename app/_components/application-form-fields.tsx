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
                placeholder="Apple | Facebook | etc.."
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
                placeholder="e.g. 30k - 40k"
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
                placeholder="Tel Aviv"
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
        name="statusCategory"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full md:col-span-1">
            <FormLabel>Status category</FormLabel>
            <Select
              value={field.value || getStatusKind(form.getValues("status"))}
              onValueChange={(value) => {
                field.onChange(value);
                const defaultLabel = statusLabels[value as keyof typeof statusLabels] || value;
                form.setValue("status", defaultLabel);
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
                placeholder="Linkedin"
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
        name="date_applied"
        render={({ field }) => (
          <FormItem className="space-y-0 col-span-full">
            <FormLabel>Date applied</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "group flex h-10 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-normal text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP")
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
                  selected={new Date(field.value!)}
                  onSelect={field.onChange}
                  disabled={(date: Date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
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
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            "Submit"
          )}
        </Button>
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
