import { eq, inArray, SQL } from "drizzle-orm";
import { jobApplications } from "@/app/db/schema";

/**
 * Builds a robust SQL condition for filtering applications by month,
 * matching both single-digit ("1") and zero-padded ("01") representations.
 */
export function buildMonthCondition(month?: string): SQL | null {
  if (!month || month === "all") return null;
  const num = parseInt(month, 10);
  if (isNaN(num)) return eq(jobApplications.month, month);
  const singleDigit = num.toString();
  const doubleDigit = num.toString().padStart(2, "0");
  return inArray(jobApplications.month, [singleDigit, doubleDigit]);
}
