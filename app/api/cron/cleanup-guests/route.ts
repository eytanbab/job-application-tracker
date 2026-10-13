import { NextResponse } from "next/server";
import { cleanupInactiveGuests } from "@/lib/account-data";
import { rejectUnauthorizedCron } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;

/**
 * Deletes data owned by guest sessions with no activity for 90 days,
 * including their S3 files. `?dryRun=1` returns counts without deleting;
 * `?limit=N` caps how many guests one run handles (default 200).
 */
export async function GET(req: Request) {
  const rejection = rejectUnauthorizedCron(req);
  if (rejection) return rejection;

  const params = new URL(req.url).searchParams;
  const dryRun = ["1", "true"].includes(params.get("dryRun") ?? "");
  const requestedLimit = Number(params.get("limit") ?? DEFAULT_LIMIT);
  const limit =
    Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  try {
    const report = await cleanupInactiveGuests({ dryRun, limit });
    console.info("[Cron] Guest cleanup:", JSON.stringify(report));

    return NextResponse.json(
      {
        success: report.failures.length === 0,
        ...report,
        timestamp: new Date().toISOString(),
      },
      { status: report.failures.length === 0 ? 200 : 500 },
    );
  } catch (error) {
    console.error("[Cron] Failed to clean up guest data:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
