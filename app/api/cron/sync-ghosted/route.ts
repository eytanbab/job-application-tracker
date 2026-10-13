import { NextResponse } from "next/server";
import { syncGhostedApplications } from "@/app/actions/applications";
import { rejectUnauthorizedCron } from "@/lib/security/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rejection = rejectUnauthorizedCron(req);
  if (rejection) return rejection;

  try {
    const transitionedCount = await syncGhostedApplications();

    return NextResponse.json({
      success: true,
      transitionedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Failed to sync ghosted applications:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
