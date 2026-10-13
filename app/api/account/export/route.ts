import { NextResponse } from "next/server";
import { format } from "date-fns";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { applicationsToCsv, collectUserData } from "@/lib/account-data";

export const dynamic = "force-dynamic";

/**
 * Downloads the current user's (or guest's) data.
 * `?format=json` (default): applications, status history and document metadata.
 * `?format=csv`: applications only.
 */
export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await getCurrentUserIdOrThrow();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exportFormat = new URL(req.url).searchParams.get("format") ?? "json";
  if (exportFormat !== "json" && exportFormat !== "csv") {
    return NextResponse.json(
      { error: "format must be json or csv" },
      { status: 400 },
    );
  }

  const data = await collectUserData(userId);
  const now = new Date();
  const baseName = `job-tracker-export-${format(now, "yyyy-MM-dd")}`;

  const body =
    exportFormat === "csv"
      ? applicationsToCsv(data.applications)
      : JSON.stringify(
          {
            exportedAt: now.toISOString(),
            counts: {
              applications: data.applications.length,
              statusHistory: data.statusHistory.length,
              documents: data.documents.length,
            },
            ...data,
          },
          null,
          2,
        );

  return new NextResponse(body, {
    headers: {
      "Content-Type":
        exportFormat === "csv"
          ? "text/csv; charset=utf-8"
          : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.${exportFormat}"`,
      "Cache-Control": "no-store",
    },
  });
}
