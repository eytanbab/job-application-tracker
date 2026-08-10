"use server";
import { addDays, differenceInDays, format, subDays, parseISO } from "date-fns";
import { and, count, desc, eq, gte, lt, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/app/db";
import { jobApplications, applicationStatusHistory } from "@/app/db/schema";

import {
  formatApplicationsPerYear,
  getStatusKind,
  statusLabels,
  didReachInterviewStage,
  extractRootDomain,
} from "@/lib/utils";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

export async function getKpiSummary() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () => {
      const allApplications = await db
        .select({
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const totalApplications = allApplications.length;
      const applicationsWithInterview = allApplications.filter(
        (app) => didReachInterviewStage(app.status, app.statusCategory)
      ).length;
      const applicationsWithOffer = allApplications.filter(
        (app) => getStatusKind(app.status, app.statusCategory) === "accepted"
      ).length;
      const activeApplications = allApplications.filter((app) => {
        const statusKind = getStatusKind(app.status, app.statusCategory);
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
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const applied = allApplications.length;
      const interviewing = allApplications.filter(
        (app) => didReachInterviewStage(app.status, app.statusCategory)
      ).length;
      const offer = allApplications.filter(
        (app) => getStatusKind(app.status, app.statusCategory) === "accepted"
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
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const domainStats: {
        [domain: string]: { total: number; interviews: number };
      } = {};

      applications.forEach(({ link, status, statusCategory }) => {
        if (!link) return;
        try {
          const rawUrl = link.startsWith("http://") || link.startsWith("https://") ? link : `https://${link}`;
          const url = new URL(rawUrl);
          const domain = extractRootDomain(url.hostname);

          if (!domainStats[domain]) {
            domainStats[domain] = { total: 0, interviews: 0 };
          }
          domainStats[domain].total++;
          if (didReachInterviewStage(status, statusCategory)) {
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
        .sort((a, b) => b.successRate - a.successRate || b.total - a.total)
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
          statusCategory: jobApplications.statusCategory,
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

      applications.forEach(({ role_name, status, statusCategory }) => {
        const keywords = role_name
          .toLowerCase()
          .split(/[\s,/-]+/)
          .filter((kw) => kw.length > 2 && !commonWords.has(kw));

        keywords.forEach((keyword) => {
          if (!keywordStats[keyword]) {
            keywordStats[keyword] = { total: 0, interviews: 0 };
          }
          keywordStats[keyword].total++;
          if (didReachInterviewStage(status, statusCategory)) {
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
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const parseSalary = (salary: string | null): number | null => {
        if (!salary) return null;
        const lowerSalary = salary.toLowerCase();
        const hasK = lowerSalary.includes("k");

        const matches = lowerSalary.match(/\d+(?:,\d{3})*(?:\.\d+)?\s*k?/g);
        if (!matches) return null;

        const values = matches
          .map((match) => {
            const rawNum = Number.parseFloat(match.replace(/,/g, "").replace("k", "").trim());
            if (!Number.isFinite(rawNum)) return null;

            const multiplier = (match.includes("k") || (hasK && rawNum < 1000) || rawNum < 500) ? 1000 : 1;
            return rawNum * multiplier;
          })
          .filter((value): value is number => value !== null && Number.isFinite(value));

        if (values.length === 0) return null;

        return values.reduce((sum, value) => sum + value, 0) / values.length;
      };

      let totalSalary = 0;
      let appliedCount = 0;
      let interviewSalary = 0;
      let interviewCount = 0;

      applications.forEach(({ salary, status, statusCategory }) => {
        const parsedSalary = parseSalary(salary);
        if (parsedSalary) {
          totalSalary += parsedSalary;
          appliedCount++;
          if (didReachInterviewStage(status, statusCategory)) {
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

export async function getGhostedApplications(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const applications = await db
        .select({
          id: jobApplications.id,
          date_applied: jobApplications.date_applied,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
          company_name: jobApplications.company_name,
        })
        .from(jobApplications)
        .where(
          and(
            ...whereClause,
            lt(jobApplications.date_applied, format(thirtyDaysAgo, "yyyy-MM-dd"))
          )
        );

      let oldestDays = 0;
      const ghostedApps: typeof applications = [];
      const companyCount = new Map<string, number>();

      applications.forEach((app) => {
        if (getStatusKind(app.status, app.statusCategory) === "applied") {
          ghostedApps.push(app);
          const name = (app.company_name || "").trim();
          if (name) {
             companyCount.set(name, (companyCount.get(name) || 0) + 1);
          }
          
          if (app.date_applied) {
            const dateStr = app.date_applied.includes("T") ? app.date_applied : `${app.date_applied}T12:00:00`;
            const days = differenceInDays(new Date(), new Date(dateStr));
            if (days > oldestDays) {
              oldestDays = days;
            }
          }
        }
      });

      const topCompanies = Array.from(companyCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(e => e[0]);

      return {
        count: ghostedApps.length,
        companies: topCompanies,
        oldestDays,
      };
    },
    ["analytics", "ghosted-applications", userId, month || "all", year || "all"],
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
          statusCategory: jobApplications.statusCategory,
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

      applications.forEach(({ date_applied, status, statusCategory }) => {
        if (!date_applied) return;
        const dateStr = date_applied.includes("T") ? date_applied : `${date_applied}T12:00:00`;
        const day = format(new Date(dateStr), "EEEE");
        if (dayOfWeekStats[day]) {
          dayOfWeekStats[day].total++;
          if (didReachInterviewStage(status, statusCategory)) {
            dayOfWeekStats[day].interviews++;
          }
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

      const lastApplicationDate = new Date(
        lastApplication[0].date_applied.includes("T")
          ? lastApplication[0].date_applied
          : `${lastApplication[0].date_applied}T12:00:00`
      );
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
    async () => {
      const data = await db
        .select({
          name: jobApplications.company_name,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const companyMap = new Map<string, { name: string; freq: number }>();

      data.forEach(({ name }) => {
        const trimmed = (name || "").trim();
        if (!trimmed || trimmed.toLowerCase() === "n/a" || trimmed.toLowerCase() === "none") return;

        const normalizedKey = trimmed.toLowerCase();
        if (companyMap.has(normalizedKey)) {
          companyMap.get(normalizedKey)!.freq++;
        } else {
          companyMap.set(normalizedKey, { name: trimmed, freq: 1 });
        }
      });

      return Array.from(companyMap.values())
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 5);
    },
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
    async () => {
      const data = await db
        .select({
          name: jobApplications.platform,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const platformMap = new Map<string, { name: string; freq: number }>();

      data.forEach(({ name }) => {
        const trimmed = (name || "").trim();
        if (!trimmed) return;

        const normalizedKey = trimmed.toLowerCase();
        if (platformMap.has(normalizedKey)) {
          platformMap.get(normalizedKey)!.freq++;
        } else {
          platformMap.set(normalizedKey, { name: trimmed, freq: 1 });
        }
      });

      return Array.from(platformMap.values())
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 5);
    },
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
    async () => {
      const data = await db
        .select({
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const statusMap = new Map<string, { name: string; freq: number }>();

      data.forEach(({ status, statusCategory }) => {
        const kind = getStatusKind(status, statusCategory);
        const label = statusLabels[kind] || kind;

        if (statusMap.has(kind)) {
          statusMap.get(kind)!.freq++;
        } else {
          statusMap.set(kind, { name: label, freq: 1 });
        }
      });

      return Array.from(statusMap.values())
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 5);
    },
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
    async () => {
      const data = await db
        .select({
          name: jobApplications.location,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const locationMap = new Map<string, { name: string; freq: number }>();

      data.forEach(({ name }) => {
        const trimmed = (name || "").trim();
        if (!trimmed) return;

        const normalizedKey = trimmed.toLowerCase();
        if (locationMap.has(normalizedKey)) {
          locationMap.get(normalizedKey)!.freq++;
        } else {
          locationMap.set(normalizedKey, { name: trimmed, freq: 1 });
        }
      });

      return Array.from(locationMap.values())
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 5);
    },
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
    async () => {
      const data = await db
        .select({
          name: jobApplications.role_name,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const roleMap = new Map<string, { name: string; freq: number }>();

      data.forEach(({ name }) => {
        const trimmed = (name || "").trim();
        if (!trimmed || trimmed.toLowerCase() === "n/a" || trimmed.toLowerCase() === "none") return;

        const normalizedKey = trimmed.toLowerCase();
        if (roleMap.has(normalizedKey)) {
          roleMap.get(normalizedKey)!.freq++;
        } else {
          roleMap.set(normalizedKey, { name: trimmed, freq: 1 });
        }
      });

      return Array.from(roleMap.values())
        .sort((a, b) => b.freq - a.freq)
        .slice(0, 5);
    },
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
    async () => {
      const data = await db
        .select({
          year: jobApplications.year,
          month: jobApplications.month,
          status: jobApplications.statusCategory,
          statusCount: count(jobApplications.id),
        })
        .from(jobApplications)
        .where(and(...whereClause))
        .groupBy(
          jobApplications.month,
          jobApplications.year,
          jobApplications.statusCategory
        );

      return data.map((item) => ({
        ...item,
        status: statusLabels[getStatusKind(null, item.status)],
      }));
    },
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
          id: jobApplications.id,
          platformName: jobApplications.platform,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const appIds = data.map((d) => d.id);
      const history =
        appIds.length > 0
          ? await db
              .select({
                applicationId: applicationStatusHistory.applicationId,
                statusCategory: applicationStatusHistory.statusCategory,
                status: applicationStatusHistory.status,
              })
              .from(applicationStatusHistory)
              .where(inArray(applicationStatusHistory.applicationId, appIds))
          : [];

      const historyMap = new Map<string, typeof history>();
      history.forEach((h) => {
        const existing = historyMap.get(h.applicationId);
        if (existing) {
          existing.push(h);
        } else {
          historyMap.set(h.applicationId, [h]);
        }
      });

      const platformMap = new Map<
        string,
        {
          platformName: string;
          statusCounts: Map<string, number>;
          total: number;
          interviewCount: number;
        }
      >();

      data.forEach(({ id, platformName, status, statusCategory }) => {
        const trimmedPlatform = (platformName || "").trim();
        if (!trimmedPlatform) return;

        const normalizedPlatformKey = trimmedPlatform.toLowerCase();

        if (!platformMap.has(normalizedPlatformKey)) {
          platformMap.set(normalizedPlatformKey, {
            platformName: trimmedPlatform,
            statusCounts: new Map(),
            total: 0,
            interviewCount: 0,
          });
        }

        const platformEntry = platformMap.get(normalizedPlatformKey)!;
        platformEntry.total++;

        const appHistory = historyMap.get(id) || [];
        const reachedInterview =
          didReachInterviewStage(status, statusCategory) ||
          appHistory.some((h) => didReachInterviewStage(h.status, h.statusCategory));

        if (reachedInterview) {
          platformEntry.interviewCount++;
        }

        const kind = getStatusKind(status, statusCategory);
        const currentCount = platformEntry.statusCounts.get(kind) || 0;
        platformEntry.statusCounts.set(kind, currentCount + 1);
      });

      return Array.from(platformMap.values())
        .sort((a, b) => b.total - a.total)
        .map(({ platformName, statusCounts, total, interviewCount }) => {
          const statuses = Array.from(statusCounts.entries())
            .map(([kind, value]) => ({
              status: kind,
              value,
            }))
            .sort((a, b) => b.value - a.value);

          return {
            platformName,
            statuses,
            total,
            interviewCount,
          };
        });
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
      const applications = await db
        .select({
          id: jobApplications.id,
          platform: jobApplications.platform,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId));

      const appIds = applications.map((a) => a.id);
      const history =
        appIds.length > 0
          ? await db
              .select({
                applicationId: applicationStatusHistory.applicationId,
                statusCategory: applicationStatusHistory.statusCategory,
                status: applicationStatusHistory.status,
              })
              .from(applicationStatusHistory)
              .where(inArray(applicationStatusHistory.applicationId, appIds))
          : [];

      const historyMap = new Map<string, typeof history>();
      history.forEach((h) => {
        const existing = historyMap.get(h.applicationId);
        if (existing) {
          existing.push(h);
        } else {
          historyMap.set(h.applicationId, [h]);
        }
      });

      const platformStats: {
        [platform: string]: { total: number; interviews: number };
      } = {};

      applications.forEach(({ id, platform, status, statusCategory }) => {
        const trimmed = (platform || "").trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();

        if (!platformStats[key]) {
          platformStats[key] = { total: 0, interviews: 0 };
        }
        platformStats[key].total++;

        const appHistory = historyMap.get(id) || [];
        const reachedInterview =
          didReachInterviewStage(status, statusCategory) ||
          appHistory.some((h) => didReachInterviewStage(h.status, h.statusCategory));

        if (reachedInterview) {
          platformStats[key].interviews++;
        }
      });

      return Object.entries(platformStats)
        .map(([platformKey, stats]) => ({
          platform: platformKey,
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

export async function getDetailedApplicationBreakdown(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      // 1. Fetch all applications matching the filter
      const apps = await db
        .select({
          id: jobApplications.id,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
          createdAt: jobApplications.createdAt,
          dateApplied: jobApplications.date_applied,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      if (apps.length === 0) {
        return {
          total: 0,
          stages: {
            applied: 0,
            interview: 0,
            accepted: 0,
          },
          breakdown: {
            active: 0,
            offered: 0,
            rejectedResume: 0,
            rejectedInterview: 0,
            ghostedResume: 0,
            ghostedInterview: 0,
          },
          resumeConversion: 0,
          interviewConversion: 0,
          responseConversion: 0,
          averageResponseDays: null as number | null,
        };
      }

      // 2. Fetch history for these applications
      const appIds = apps.map((app) => app.id);
      const history = await db
        .select({
          applicationId: applicationStatusHistory.applicationId,
          statusCategory: applicationStatusHistory.statusCategory,
          status: applicationStatusHistory.status,
          createdAt: applicationStatusHistory.createdAt,
        })
        .from(applicationStatusHistory)
        .where(inArray(applicationStatusHistory.applicationId, appIds));

      // Group history by applicationId
      const historyMap = new Map<string, typeof history>();
      history.forEach((h) => {
        const existing = historyMap.get(h.applicationId);
        if (existing) {
          existing.push(h);
        } else {
          historyMap.set(h.applicationId, [h]);
        }
      });

      let activeCount = 0;
      let offeredCount = 0;
      let rejectedResumeCount = 0;
      let rejectedInterviewCount = 0;
      let ghostedResumeCount = 0;
      let ghostedInterviewCount = 0;

      let totalResponseDays = 0;
      let totalResponseCount = 0;

      const thirtyDaysAgo = subDays(new Date(), 30);

      apps.forEach((app) => {
        const appHistory = historyMap.get(app.id) || [];
        
        // Did it ever reach the interview stage?
        const reachedInterview =
          didReachInterviewStage(app.status, app.statusCategory) ||
          appHistory.some((h) => didReachInterviewStage(h.status, h.statusCategory));

        const currentKind = getStatusKind(app.status, app.statusCategory);

        if (currentKind === "accepted") {
          offeredCount++;
        } else if (currentKind === "applied" || currentKind === "review" || currentKind === "interview") {
          const dateApplied = app.dateApplied ? parseISO(app.dateApplied) : null;
          const isOlderThan30Days = dateApplied && !isNaN(dateApplied.getTime()) ? dateApplied < thirtyDaysAgo : false;

          if (isOlderThan30Days && currentKind === "applied") {
            if (reachedInterview) {
              ghostedInterviewCount++;
            } else {
              ghostedResumeCount++;
            }
          } else {
            activeCount++;
          }
        } else if (currentKind === "ghosted") {
          if (reachedInterview) {
            ghostedInterviewCount++;
          } else {
            ghostedResumeCount++;
          }
        } else if (currentKind === "rejected") {
          if (reachedInterview) {
            rejectedInterviewCount++;
          } else {
            rejectedResumeCount++;
          }
        } else {
          activeCount++;
        }

        // Response velocity calculation (time to first recruiter response, excluding ghosted apps)
        const isGhostedApp =
          currentKind === "ghosted" ||
          (currentKind === "applied" &&
            app.dateApplied &&
            parseISO(app.dateApplied) < thirtyDaysAgo);

        if (!isGhostedApp) {
          const firstResponseHistory = appHistory
            .filter((h) => {
              const kind = getStatusKind(h.status, h.statusCategory);
              return kind !== "applied" && kind !== "ghosted";
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          if (firstResponseHistory.length > 0 && app.dateApplied) {
            const appliedDate = parseISO(app.dateApplied);
            if (!isNaN(appliedDate.getTime())) {
              const firstResponseDate = new Date(firstResponseHistory[0].createdAt);
              const diffDays = Math.max(0, differenceInDays(firstResponseDate, appliedDate));
              totalResponseDays += diffDays;
              totalResponseCount++;
            }
          }
        }
      });

      const total = apps.length;
      
      // Calculate funnel counts (unique applications that reached each stage)
      const uniqueApplied = total;
      const uniqueInterview = apps.filter(app => {
        const appHistory = historyMap.get(app.id) || [];
        return didReachInterviewStage(app.status, app.statusCategory) ||
          appHistory.some(h => didReachInterviewStage(h.status, h.statusCategory));
      }).length;
      const uniqueOffer = offeredCount;

      // Responded applications = Got interview OR offer OR rejected
      const respondedCount = uniqueInterview + rejectedResumeCount;

      // Conversions
      const resumeConversion = uniqueApplied ? (uniqueInterview / uniqueApplied) * 100 : 0;
      const interviewConversion = uniqueInterview ? (uniqueOffer / uniqueInterview) * 100 : 0;
      const responseConversion = uniqueApplied ? (respondedCount / uniqueApplied) * 100 : 0;

      const averageResponseDays = totalResponseCount > 0
        ? Math.round(totalResponseDays / totalResponseCount)
        : null;

      return {
        total,
        stages: {
          applied: uniqueApplied,
          interview: uniqueInterview,
          accepted: uniqueOffer,
        },
        breakdown: {
          active: activeCount,
          offered: offeredCount,
          rejectedResume: rejectedResumeCount,
          rejectedInterview: rejectedInterviewCount,
          ghostedResume: ghostedResumeCount,
          ghostedInterview: ghostedInterviewCount,
        },
        resumeConversion,
        interviewConversion,
        responseConversion,
        averageResponseDays,
      };
    },
    ["analytics", "detailed-breakdown", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

export async function getBestPlatformInsight(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
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

      const appIds = data.map((d) => d.id);
      const history =
        appIds.length > 0
          ? await db
              .select({
                applicationId: applicationStatusHistory.applicationId,
                statusCategory: applicationStatusHistory.statusCategory,
                status: applicationStatusHistory.status,
              })
              .from(applicationStatusHistory)
              .where(inArray(applicationStatusHistory.applicationId, appIds))
          : [];

      const historyMap = new Map<string, typeof history>();
      history.forEach((h) => {
        const existing = historyMap.get(h.applicationId);
        if (existing) {
          existing.push(h);
        } else {
          historyMap.set(h.applicationId, [h]);
        }
      });

      const platformStats = new Map<string, { name: string; total: number; interviews: number }>();

      data.forEach(({ id, platform, status, statusCategory }) => {
        const trimmed = (platform || "").trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();

        if (!platformStats.has(key)) {
          platformStats.set(key, { name: trimmed, total: 0, interviews: 0 });
        }
        const stats = platformStats.get(key)!;
        stats.total++;

        const appHistory = historyMap.get(id) || [];
        const reachedInterview =
          didReachInterviewStage(status, statusCategory) ||
          appHistory.some((h) => didReachInterviewStage(h.status, h.statusCategory));

        if (reachedInterview) {
          stats.interviews++;
        }
      });

      const platformsWithRates = Array.from(platformStats.values())
        .map((p) => ({
          ...p,
          interviewRate: p.total > 0 ? (p.interviews / p.total) * 100 : 0,
        }))
        .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total);

      const bestPlatform = platformsWithRates.length > 0 ? platformsWithRates[0] : null;
      const secondBest = platformsWithRates.length > 1 ? platformsWithRates[1] : null;
      const multiplier = bestPlatform && secondBest && secondBest.interviewRate > 0
        ? bestPlatform.interviewRate / secondBest.interviewRate
        : 1;

      return { bestPlatform, secondBest, multiplier };
    },
    ["analytics", "best-platform-insight", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

