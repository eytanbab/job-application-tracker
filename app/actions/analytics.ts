"use server";
import { addDays, format, subDays } from "date-fns";
import { and, count, desc, eq, gte, lt } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/app/db";
import { jobApplications } from "@/app/db/schema";

import { formatApplicationsPerYear, getStatusKind } from "@/lib/utils";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

export async function getKpiSummary() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const allApplications = await db
        .select({
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const totalApplications = allApplications.length;
      const applicationsWithInterview = allApplications.filter(
        (app) => getStatusKind(app.status) === "interview"
      ).length;
      const applicationsWithOffer = allApplications.filter(
        (app) => getStatusKind(app.status) === "accepted"
      ).length;
      const activeApplications = allApplications.filter((app) => {
        const statusKind = getStatusKind(app.status);
        return (
          statusKind === "applied" ||
          statusKind === "interview" ||
          statusKind === "review"
        );
      }).length;

      const interviewRate =
        totalApplications > 0
          ? (applicationsWithInterview / totalApplications) * 100
          : 0;
      const offerRate =
        applicationsWithInterview > 0
          ? (applicationsWithOffer / applicationsWithInterview) * 100
          : 0;

      return {
        totalApplications,
        interviewRate,
        offerRate,
        activePipeline: activeApplications,
      };
    },
    ["analytics", "kpi-summary", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getApplicationsFunnel() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const allApplications = await db
        .select({
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const applied = allApplications.length;
      const interviewing = allApplications.filter(
        (app) => getStatusKind(app.status) === "interview"
      ).length;
      const offer = allApplications.filter(
        (app) => getStatusKind(app.status) === "accepted"
      ).length;

      return [
        { name: "Applied", value: applied },
        { name: "Interviewing", value: interviewing },
        { name: "Offer", value: offer },
      ];
    },
    ["analytics", "applications-funnel", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getConsistencyHeatmapData() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const today = new Date();
      const oneYearAgo = subDays(today, 365);

      const data = await db
        .select({
          date: jobApplications.date_applied,
          count: count(jobApplications.id),
        })
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.userId, userId),
            gte(jobApplications.date_applied, format(oneYearAgo, "yyyy-MM-dd"))
          )
        )
        .groupBy(jobApplications.date_applied);

      const heatmapData = new Array(365).fill(0).map((_, i) => {
        const date = format(addDays(oneYearAgo, i), "yyyy-MM-dd");
        const entry = data.find((d) => d.date === date);
        return {
          date,
          count: entry ? entry.count : 0,
        };
      });

      return heatmapData;
    },
    ["analytics", "consistency-heatmap", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getDomainLeaderboard() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const applications = await db
        .select({
          link: jobApplications.link,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const domainStats: {
        [domain: string]: { total: number; interviews: number };
      } = {};

      applications.forEach(({ link, status }) => {
        try {
          const url = new URL(link);
          let domain = url.hostname;
          // Basic cleaning for common subdomains
          if (domain.startsWith("www.")) {
            domain = domain.substring(4);
          }
          if (
            domain.includes("greenhouse.io") ||
            domain.includes("lever.co") ||
            domain.includes("workday.com")
          ) {
            const parts = domain.split(".");
            if (parts.length > 2) {
              domain = parts.slice(-2).join(".");
            }
          }

          if (!domainStats[domain]) {
            domainStats[domain] = { total: 0, interviews: 0 };
          }
          domainStats[domain].total++;
          if (getStatusKind(status) === "interview") {
            domainStats[domain].interviews++;
          }
        } catch {
          // Invalid URL, skip
        }
      });

      return Object.entries(domainStats)
        .map(([domain, stats]) => ({
          domain,
          ...stats,
          successRate:
            stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);
    },
    ["analytics", "domain-leaderboard", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getKeywordPerformance() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const applications = await db
        .select({
          role_name: jobApplications.role_name,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const keywordStats: {
        [keyword: string]: { total: number; interviews: number };
      } = {};

      const commonWords = new Set([
        "a",
        "an",
        "the",
        "in",
        "on",
        "at",
        "for",
        "to",
        "of",
        "with",
        "and",
        "or",
        "but",
      ]);

      applications.forEach(({ role_name, status }) => {
        const keywords = role_name
          .toLowerCase()
          .split(/[\s,/-]+/)
          .filter((kw) => kw.length > 2 && !commonWords.has(kw));

        keywords.forEach((keyword) => {
          if (!keywordStats[keyword]) {
            keywordStats[keyword] = { total: 0, interviews: 0 };
          }
          keywordStats[keyword].total++;
          if (getStatusKind(status) === "interview") {
            keywordStats[keyword].interviews++;
          }
        });
      });

      return Object.entries(keywordStats)
        .map(([keyword, stats]) => ({
          keyword,
          ...stats,
          interviewRate:
            stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.interviews - a.interviews)
        .slice(0, 5);
    },
    ["analytics", "keyword-performance", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getSalaryRealityCheck() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const applications = await db
        .select({
          salary: jobApplications.salary,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const parseSalary = (salary: string | null): number | null => {
        if (!salary) return null;
        const matches = salary
          .toLowerCase()
          .match(/\d+(?:,\d{3})*(?:\.\d+)?\s*k?/g);
        if (!matches) return null;

        const values = matches
          .map((match) => {
            const multiplier = match.includes("k") ? 1000 : 1;
            const normalized = match.replace(/,/g, "").replace("k", "").trim();
            return Number.parseFloat(normalized) * multiplier;
          })
          .filter((value) => Number.isFinite(value));

        if (values.length === 0) return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };

      let totalSalary = 0;
      let appliedCount = 0;
      let interviewSalary = 0;
      let interviewCount = 0;

      applications.forEach(({ salary, status }) => {
        const parsedSalary = parseSalary(salary);
        if (parsedSalary) {
          totalSalary += parsedSalary;
          appliedCount++;
          if (getStatusKind(status) === "interview") {
            interviewSalary += parsedSalary;
            interviewCount++;
          }
        }
      });

      const avgAppliedSalary =
        appliedCount > 0 ? totalSalary / appliedCount : 0;
      const avgInterviewSalary =
        interviewCount > 0 ? interviewSalary / interviewCount : 0;

      return [
        { name: "Average Applied Salary", value: avgAppliedSalary },
        { name: "Average Interview Salary", value: avgInterviewSalary },
      ];
    },
    ["analytics", "salary-reality-check", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getGhostedApplications() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const applications = await db
        .select({
          id: jobApplications.id,
          date_applied: jobApplications.date_applied,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.userId, userId),
            lt(
              jobApplications.date_applied,
              format(thirtyDaysAgo, "yyyy-MM-dd")
            )
          )
        );
      const ghosted = applications.filter(
        (app) => getStatusKind(app.status) === "applied"
      );
      return ghosted.length;
    },
    ["analytics", "ghosted-applications", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getDayOfWeekPerformance() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const applications = await db
        .select({
          date_applied: jobApplications.date_applied,
          status: jobApplications.status,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const dayOfWeekStats: {
        [day: string]: { total: number; interviews: number };
      } = {
        Sunday: { total: 0, interviews: 0 },
        Monday: { total: 0, interviews: 0 },
        Tuesday: { total: 0, interviews: 0 },
        Wednesday: { total: 0, interviews: 0 },
        Thursday: { total: 0, interviews: 0 },
        Friday: { total: 0, interviews: 0 },
        Saturday: { total: 0, interviews: 0 },
      };

      applications.forEach(({ date_applied, status }) => {
        const day = format(new Date(date_applied), "EEEE");
        dayOfWeekStats[day].total++;
        if (getStatusKind(status) === "interview") {
          dayOfWeekStats[day].interviews++;
        }
      });

      return Object.entries(dayOfWeekStats)
        .map(([day, stats]) => ({
          day,
          ...stats,
          successRate:
            stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
        }))
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);
    },
    ["analytics", "day-of-week-performance", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getActionableNudges() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const lastApplication = await db
        .select({
          date_applied: jobApplications.date_applied,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .orderBy(desc(jobApplications.date_applied))
        .limit(1);

      if (lastApplication.length === 0) {
        return "You haven't applied to any jobs yet. Let's get started!";
      }

      const lastApplicationDate = new Date(lastApplication[0].date_applied);
      const daysSinceLastApplication = Math.round(
        (new Date().getTime() - lastApplicationDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastApplication > 3) {
        return `You haven't applied in ${daysSinceLastApplication} days, keep the momentum up!`;
      }

      return "You are on a roll! Keep up the great work.";
    },
    ["analytics", "actionable-nudges", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getTop5Companies(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          name: jobApplications.company_name,
          freq: count(jobApplications.company_name),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.company_name)
        .orderBy(desc(count(jobApplications.company_name)))
        .limit(5),
    ["analytics", "top-5-companies", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getTop5Platforms(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          name: jobApplications.platform,
          freq: count(jobApplications.platform),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.platform)
        .orderBy(desc(count(jobApplications.platform)))
        .limit(5),
    ["analytics", "top-5-platforms", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getTop5Statuses(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          name: jobApplications.status,
          freq: count(jobApplications.status),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.status)
        .orderBy(desc(count(jobApplications.status)))
        .limit(5),
    ["analytics", "top-5-statuses", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getTop5Locations(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          name: jobApplications.location,
          freq: count(jobApplications.location),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.location)
        .orderBy(desc(count(jobApplications.location)))
        .limit(5),
    ["analytics", "top-5-locations", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getTop5RoleNames(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          name: jobApplications.role_name,
          freq: count(jobApplications.role_name),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.role_name)
        .orderBy(desc(count(jobApplications.role_name)))
        .limit(5),
    ["analytics", "top-5-role-names", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

// Total applications per year
export async function getApplicationsPerYear(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          year: jobApplications.year,
          month: jobApplications.month,
          numOfApplications: count(jobApplications.id),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.month, jobApplications.year);

      return formatApplicationsPerYear(data);
    },
    [
      "analytics",
      "applications-per-year",
      userId,
      month || "all",
      year || "all",
    ],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

// Statuses per year
export async function getStasusesPerYear(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () =>
      db
        .select({
          year: jobApplications.year,
          month: jobApplications.month,
          status: jobApplications.status,
          statusCount: count(jobApplications.status),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(
          jobApplications.month,
          jobApplications.year,
          jobApplications.status
        ),
    ["analytics", "statuses-per-year", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getYears() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const years = await db
        .selectDistinct({
          year: jobApplications.year,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .orderBy(desc(jobApplications.year));

      const yearsArray: string[] = [];
      years?.map((year) => {
        yearsArray.push(year.year!);
      });

      return yearsArray;
    },
    ["analytics", "years", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getStatusPerPlatform(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          platformName: jobApplications.platform,
          status: jobApplications.status,
          numOfApplications: count(jobApplications.platform),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(jobApplications.platform, jobApplications.status)
        .orderBy(desc(jobApplications.status));

      const grouped = new Map();
      const platformTotals = new Map();

      // First pass: group by platform and calculate totals
      data.forEach(({ platformName, status, numOfApplications }) => {
        if (!grouped.has(platformName)) {
          grouped.set(platformName, []);
          platformTotals.set(platformName, 0);
        }
        grouped.get(platformName).push({ status, value: numOfApplications });
        platformTotals.set(
          platformName,
          platformTotals.get(platformName) + numOfApplications
        );
      });

      // Convert to array and sort by total applications
      return Array.from(grouped.entries())
        .map(([platformName, statuses]) => ({
          platformName,
          // Sort statuses by value (number of applications) in descending order
          statuses: [...statuses].sort((a, b) => b.value - a.value),
          total: platformTotals.get(platformName),
        }))
        .sort((a, b) => b.total - a.total)
        .map(({ platformName, statuses }) => ({
          platformName,
          statuses,
        }));
    },
    ["analytics", "status-per-platform", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getPlatformPerformance() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const data = await db
        .select({
          platform: jobApplications.platform,
          status: jobApplications.status,
          count: count(jobApplications.id),
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .groupBy(jobApplications.platform, jobApplications.status);

      const platformStats: {
        [platform: string]: { total: number; interviews: number };
      } = {};

      data.forEach(({ platform, status, count }) => {
        if (!platformStats[platform]) {
          platformStats[platform] = { total: 0, interviews: 0 };
        }
        platformStats[platform].total += count;
        if (getStatusKind(status) === "interview") {
          platformStats[platform].interviews += count;
        }
      });

      return Object.entries(platformStats)
        .map(([platform, stats]) => ({
          platform,
          ...stats,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    },
    ["analytics", "platform-performance", userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}
