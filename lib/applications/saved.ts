import { format } from "date-fns";

/**
 * The date to store when an application changes status. A saved job keeps
 * the day it was saved in date_applied, so when it moves on to a sent
 * status that date becomes today, unless this save also picks a date.
 */
export function dateAfterStatusChange(input: {
  previousCategory: string | null | undefined;
  nextCategory: string | null | undefined;
  storedDate: string;
  nextDate: string;
  today?: Date;
}): string {
  const leavingSaved =
    input.previousCategory === "saved" && input.nextCategory !== "saved";
  if (leavingSaved && input.nextDate === input.storedDate) {
    return format(input.today ?? new Date(), "yyyy-MM-dd");
  }
  return input.nextDate;
}
