import { db } from "@/app/db";
import { jobApplications, applicationStatusHistory } from "@/app/db/schema";
import { eq, desc, and, count, gte, lt } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "@/app/actions/_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { didReachInterviewStage } from "@/lib/utils";

export async function getOverviewMetrics(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all") whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const apps = await db
        .select({
          id: jobApplications.id,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const totalApplications = apps.length;
      
      let ghosted = 0;
      let rejected = 0;
      let interview = 0;
      let accepted = 0;
      let activePipeline = 0;

      apps.forEach((app) => {
        if (didReachInterviewStage(app.status, app.statusCategory)) {
          interview++;
        }

        if (app.statusCategory === 'ghosted') ghosted++;
        else if (app.statusCategory === 'rejected') rejected++;
        else if (app.statusCategory === 'accepted') accepted++;
        
        if (app.statusCategory === 'applied' || app.statusCategory === 'review' || app.statusCategory === 'interview') {
          activePipeline++;
        }
      });

      const ghostRate = totalApplications > 0 ? (ghosted / totalApplications) * 100 : 0;
      const interviewYield = totalApplications > 0 ? (interview / totalApplications) * 100 : 0;

      return {
        totalApplications,
        activePipeline,
        interviewYield,
        ghostRate,
        ghosted,
        rejected,
        interview,
        accepted,
      };
    },
    ["analytics-overview", "metrics", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

import { subDays, format } from "date-fns";

export async function getApplicationVelocity(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all") whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          date: jobApplications.date_applied,
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .orderBy(jobApplications.date_applied);

      const counts: Record<string, number> = {};
      data.forEach((app) => {
        // format as yyyy-MM
        const dateObj = new Date(app.date);
        const yyyyMM = format(dateObj, 'MMM yyyy');
        counts[yyyyMM] = (counts[yyyyMM] || 0) + 1;
      });

      return Object.entries(counts).map(([date, count]) => ({ date, count }));
    },
    ["analytics-overview", "velocity", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}
