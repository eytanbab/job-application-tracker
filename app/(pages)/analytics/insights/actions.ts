import { db } from "@/app/db";
import { jobApplications } from "@/app/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import {
  applicationsTag,
  CACHE_REVALIDATE_SECONDS,
} from "@/app/actions/_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { syncGhostedApplications } from "@/app/actions/applications";
import { didReachInterviewStage, getStatusKind } from "@/lib/utils";
import { buildMonthCondition } from "@/app/actions/_utils/filter-utils";

export async function getPlatformRoi(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  const monthCondition = buildMonthCondition(month);
  if (monthCondition) whereClause.push(monthCondition);
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

      const platforms: Record<string, { total: number; interviews: number }> =
        {};

      data.forEach((app) => {
        const plat = app.platform || "unknown";
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
          yieldRate:
            stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
    [
      "analytics-insights",
      "platform-roi",
      userId,
      month || "all",
      year || "all",
    ],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}

export async function getBlackHoleBreakdown(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  await syncGhostedApplications(userId);

  const whereClause = [eq(jobApplications.userId, userId)];
  const monthCondition = buildMonthCondition(month);
  if (monthCondition) whereClause.push(monthCondition);
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      let ghosted = 0;
      let rejected = 0;

      data.forEach((app) => {
        const kind = getStatusKind(app.status, app.statusCategory);
        if (kind === "ghosted") ghosted++;
        else if (kind === "rejected") rejected++;
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
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}

export async function getRoleTargetingAnalysis(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  const monthCondition = buildMonthCondition(month);
  if (monthCondition) whereClause.push(monthCondition);
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
        if (role.includes("frontend") || role.includes("front end"))
          role = "Frontend Developer";
        else if (role.includes("backend") || role.includes("back end"))
          role = "Backend Developer";
        else if (role.includes("fullstack") || role.includes("full stack"))
          role = "Fullstack Developer";
        else if (role.includes("product designer") || role.includes("ui/ux"))
          role = "Product Designer";
        else if (role.length > 20) role = role.substring(0, 20) + "..."; // truncate long random titles

        roles[role] = (roles[role] || 0) + 1;
      });

      return Object.entries(roles)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    [
      "analytics-insights",
      "role-targeting",
      userId,
      month || "all",
      year || "all",
    ],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}

export interface WorkModeData {
  name: string;
  total: number;
  interviews: number;
  sharePct: number;
  yieldRate: number;
}

export async function getWorkModeAnalysis(
  month?: string,
  year?: string,
): Promise<WorkModeData[]> {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  const monthCondition = buildMonthCondition(month);
  if (monthCondition) whereClause.push(monthCondition);
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          location: jobApplications.location,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const modes = {
        remote: { name: "Remote", total: 0, interviews: 0 },
        hybrid: { name: "Hybrid", total: 0, interviews: 0 },
        onsite: { name: "On-site", total: 0, interviews: 0 },
      };

      data.forEach((app) => {
        const loc = (app.location || "").toLowerCase().trim();
        let modeKey: "remote" | "hybrid" | "onsite" = "onsite";

        if (
          loc.includes("remote") ||
          loc.includes("wfh") ||
          loc.includes("virtual") ||
          loc.includes("anywhere")
        ) {
          modeKey = "remote";
        } else if (loc.includes("hybrid") || loc.includes("flexible")) {
          modeKey = "hybrid";
        } else {
          modeKey = "onsite";
        }

        modes[modeKey].total++;
        if (didReachInterviewStage(app.status, app.statusCategory)) {
          modes[modeKey].interviews++;
        }
      });

      const totalApps = data.length;
      return Object.values(modes).map((m) => ({
        ...m,
        sharePct: totalApps > 0 ? (m.total / totalApps) * 100 : 0,
        yieldRate: m.total > 0 ? (m.interviews / m.total) * 100 : 0,
      }));
    },
    ["analytics-insights", "work-mode", userId, month || "all", year || "all"],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}

export interface SalaryInsightsData {
  statedCount: number;
  totalCount: number;
  minSalary: number | null;
  maxSalary: number | null;
  avgSalary: number | null;
  topRole?: string | null;
  topCompany?: string | null;
  topSalaryFormatted?: string | null;
}

export async function getSalaryInsights(
  month?: string,
  year?: string,
): Promise<SalaryInsightsData> {
  const userId = await getCurrentUserIdOrThrow();
  const whereClause = [eq(jobApplications.userId, userId)];
  const monthCondition = buildMonthCondition(month);
  if (monthCondition) whereClause.push(monthCondition);
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          salary: jobApplications.salary,
          role_name: jobApplications.role_name,
          company_name: jobApplications.company_name,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const parsedSalaries: {
        val: number;
        raw: string;
        role: string;
        company: string;
      }[] = [];

      data.forEach((app) => {
        if (!app.salary) return;
        const clean = app.salary.toLowerCase().replace(/[$,]/g, "").trim();
        const matches = clean.match(/\d+(?:\.\d+)?\s*k?/g);
        if (matches && matches.length > 0) {
          const nums = matches
            .map((m) => {
              const hasK = m.includes("k");
              let n = parseFloat(m.replace("k", ""));
              if (hasK || n < 1000) n *= 1000;
              return n;
            })
            .filter((n) => n >= 15000 && n <= 2500000);

          if (nums.length > 0) {
            const midpoint =
              nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
            parsedSalaries.push({
              val: midpoint,
              raw: app.salary,
              role: app.role_name,
              company: app.company_name,
            });
          }
        }
      });

      if (parsedSalaries.length === 0) {
        return {
          statedCount: 0,
          totalCount: data.length,
          minSalary: null,
          maxSalary: null,
          avgSalary: null,
        };
      }

      parsedSalaries.sort((a, b) => b.val - a.val);

      const values = parsedSalaries.map((p) => p.val);
      const minSalary = Math.min(...values);
      const maxSalary = Math.max(...values);
      const avgSalary = Math.round(
        values.reduce((acc, curr) => acc + curr, 0) / values.length,
      );

      const topItem = parsedSalaries[0];

      return {
        statedCount: parsedSalaries.length,
        totalCount: data.length,
        minSalary,
        maxSalary,
        avgSalary,
        topRole: topItem.role,
        topCompany: topItem.company,
        topSalaryFormatted: topItem.raw,
      };
    },
    [
      "analytics-insights",
      "salary-insights",
      userId,
      month || "all",
      year || "all",
    ],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}
