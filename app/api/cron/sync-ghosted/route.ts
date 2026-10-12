import { NextResponse } from "next/server";
import { syncGhostedApplications } from "@/app/actions/applications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Check for authorization header if CRON_SECRET is configured
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
