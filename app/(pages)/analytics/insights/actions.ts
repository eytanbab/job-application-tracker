import { db } from "@/app/db";
import { jobApplications } from "@/app/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "@/app/actions/_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { didReachInterviewStage } from "@/lib/utils";

export async function getPlatformRoi(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all") whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          id: jobApplications.id,
          platform: jobApplications.platform,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const platforms: Record<string, { total: number; interviews: number }> = {};

      data.forEach((app) => {
        const plat = app.platform || 'unknown';
        if (!platforms[plat]) platforms[plat] = { total: 0, interviews: 0 };
        platforms[plat].total++;
        if (didReachInterviewStage(app.status, app.statusCategory)) {
          platforms[plat].interviews++;
        }
      });

      return Object.entries(platforms)
        .map(([name, stats]) => ({
          name,
          ...stats,
          yieldRate: stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
    ["analytics-insights", "platform-roi", userId, month || "all", year || "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] }
  )();
}

export async function getBlackHoleBreakdown(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all") whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      let ghosted = 0;
      let rejected = 0;

      data.forEach((app) => {
        if (app.statusCategory === 'ghosted') ghosted++;
        else if (app.statusCategory === 'rejected') rejected++;
      });

      const totalLoss = ghosted + rejected;
      return {
        ghosted,
        rejected,
        ghostedPct: totalLoss > 0 ? (ghosted / totalLoss) * 100 : 0,
        rejectedPct: totalLoss > 0 ? (rejected / totalLoss) * 100 : 0,
      };
    },
    ["analytics-insights", "blackhole", userId, month || "all", year || "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] }
  )();
}

export async function getRoleTargetingAnalysis(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all") whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          roleName: jobApplications.role_name,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const roles: Record<string, number> = {};
      data.forEach((app) => {
        // Simple normalization
        let role = app.roleName.toLowerCase().trim();
        if (role.includes('frontend') || role.includes('front end')) role = 'Frontend Developer';
        else if (role.includes('backend') || role.includes('back end')) role = 'Backend Developer';
        else if (role.includes('fullstack') || role.includes('full stack')) role = 'Fullstack Developer';
        else if (role.includes('product designer') || role.includes('ui/ux')) role = 'Product Designer';
        else if (role.length > 20) role = role.substring(0, 20) + '...'; // truncate long random titles

        roles[role] = (roles[role] || 0) + 1;
      });

      return Object.entries(roles)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    ["analytics-insights", "role-targeting", userId, month || "all", year || "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] }
  )();
}
