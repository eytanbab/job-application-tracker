import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { applicationsToCsv, collectApplications } from "@/lib/account-data";
import { resolveRange } from "@/lib/analytics/range";
import { loadAnalyticsSearchParams } from "@/lib/analytics/search-params";

export const dynamic = "force-dynamic";

/**
 * Downloads, as CSV, the applications in the period the analytics page shows.
 * Takes the same `range`/`from`/`to` params as /analytics/overview.
 */
export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await getCurrentUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const { current } = resolveRange(loadAnalyticsSearchParams(req), today);
  const applications = await collectApplications(userId, current);

  const span =
    current.from || current.to
      ? `${current.from ?? "start"}-to-${current.to ?? format(today, "yyyy-MM-dd")}`
      : `all-${format(today, "yyyy-MM-dd")}`;

  return new NextResponse(applicationsToCsv(applications), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="job-applications-${span}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
