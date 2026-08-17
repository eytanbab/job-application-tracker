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

export async function getDomainLeaderboard(month?: string, year?: string) {
  const userId = await getCurrentUserIdOrThrow();

  const whereClause = [eq(jobApplications.userId, userId)];
  if (month && month !== "all")
    whereClause.push(eq(jobApplications.month, month));
  if (year && year !== "all") whereClause.push(eq(jobApplications.year, year));

  return unstable_cache(
    async () => {
      const applications = await db
        .select({
          link: jobApplications.link,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      const domainStats: {
        [domain: string]: { total: number; interviews: number };
      } = {};

      applications.forEach(({ link, status, statusCategory }) => {
        if (!link) return;
        try {
          const rawUrl =
            link.startsWith("http://") || link.startsWith("https://")
              ? link
              : `https://${link}`;
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
    ["analytics", "domain-leaderboard", userId, month || "all", year || "all"],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    },
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
    },
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
      const applications = await db
        .select({
          id: jobApplications.id,
          date_applied: jobApplications.date_applied,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
          company_name: jobApplications.company_name,
        })
        .from(jobApplications)
        .where(and(...whereClause));

      let oldestDays = 0;
      const ghostedApps: typeof applications = [];
      const ghostedCompanyCount = new Map<string, number>();
      const followUpApps: typeof applications = [];
      const followUpCompanyCount = new Map<string, number>();

      const now = new Date();

      applications.forEach((app) => {
        const kind = getStatusKind(app.status, app.statusCategory);
        if (!app.date_applied) return;

        const dateStr = app.date_applied.includes("T")
          ? app.date_applied
          : `${app.date_applied}T12:00:00`;
        const appliedDate = new Date(dateStr);
        if (isNaN(appliedDate.getTime())) return;

        const daysAgo = differenceInDays(now, appliedDate);

        if (kind === "applied") {
          if (daysAgo >= 30) {
            ghostedApps.push(app);
            const name = (app.company_name || "").trim();
            if (name) {
              ghostedCompanyCount.set(
                name,
                (ghostedCompanyCount.get(name) || 0) + 1,
              );
            }
            if (daysAgo > oldestDays) {
              oldestDays = daysAgo;
            }
          }
        }

        if (kind === "applied" || kind === "review") {
          if (daysAgo >= 7 && daysAgo <= 14) {
            followUpApps.push(app);
            const name = (app.company_name || "").trim();
            if (name) {
              followUpCompanyCount.set(
                name,
                (followUpCompanyCount.get(name) || 0) + 1,
              );
            }
          }
        }
      });

      const topGhostedCompanies = Array.from(ghostedCompanyCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);

      const topFollowUpCompanies = Array.from(followUpCompanyCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);

      return {
        count: ghostedApps.length,
        companies: topGhostedCompanies,
        oldestDays,
        followUpCount: followUpApps.length,
        followUpCompanies: topFollowUpCompanies,
      };
    },
    [
      "analytics",
      "ghosted-applications",
      userId,
      month || "all",
      year || "all",
    ],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    },
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
    },
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
          jobApplications.statusCategory,
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
    },
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
    },
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
          appHistory.some((h) =>
            didReachInterviewStage(h.status, h.statusCategory),
          );

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
    },
  )();
}

export async function getDetailedApplicationBreakdown(
  month?: string,
  year?: string,
) {
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
            activeStages: {
              applied: 0,
              review: 0,
              interview: 0,
            },
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
      let activeAppliedCount = 0;
      let activeReviewCount = 0;
      let activeInterviewCount = 0;
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
          appHistory.some((h) =>
            didReachInterviewStage(h.status, h.statusCategory),
          );

        const currentKind = getStatusKind(app.status, app.statusCategory);

        if (currentKind === "accepted") {
          offeredCount++;
        } else if (
          currentKind === "applied" ||
          currentKind === "review" ||
          currentKind === "interview"
        ) {
          const dateApplied = app.dateApplied
            ? parseISO(app.dateApplied)
            : null;
          const isOlderThan30Days =
            dateApplied && !isNaN(dateApplied.getTime())
              ? dateApplied < thirtyDaysAgo
              : false;

          if (isOlderThan30Days && currentKind === "applied") {
            if (reachedInterview) {
              ghostedInterviewCount++;
            } else {
              ghostedResumeCount++;
            }
          } else {
            activeCount++;
            if (currentKind === "applied") activeAppliedCount++;
            else if (currentKind === "review") activeReviewCount++;
            else if (currentKind === "interview") activeInterviewCount++;
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
          activeAppliedCount++;
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
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );

          if (firstResponseHistory.length > 0 && app.dateApplied) {
            const appliedDate = parseISO(app.dateApplied);
            if (!isNaN(appliedDate.getTime())) {
              const firstResponseDate = new Date(
                firstResponseHistory[0].createdAt,
              );
              const diffDays = Math.max(
                0,
                differenceInDays(firstResponseDate, appliedDate),
              );
              totalResponseDays += diffDays;
              totalResponseCount++;
            }
          }
        }
      });

      const total = apps.length;

      // Calculate funnel counts (unique applications that reached each stage)
      const uniqueApplied = total;
      const uniqueInterview = apps.filter((app) => {
        const appHistory = historyMap.get(app.id) || [];
        return (
          didReachInterviewStage(app.status, app.statusCategory) ||
          appHistory.some((h) =>
            didReachInterviewStage(h.status, h.statusCategory),
          )
        );
      }).length;
      const uniqueOffer = offeredCount;

      // Responded applications = Got interview OR offer OR rejected
      const respondedCount = uniqueInterview + rejectedResumeCount;

      // Conversions
      const resumeConversion = uniqueApplied
        ? (uniqueInterview / uniqueApplied) * 100
        : 0;
      const interviewConversion = uniqueInterview
        ? (uniqueOffer / uniqueInterview) * 100
        : 0;
      const responseConversion = uniqueApplied
        ? (respondedCount / uniqueApplied) * 100
        : 0;

      const averageResponseDays =
        totalResponseCount > 0
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
          activeStages: {
            applied: activeAppliedCount,
            review: activeReviewCount,
            interview: activeInterviewCount,
          },
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
    },
  )();
}

export async function getFunnelBottleneckInsight(
  month?: string,
  year?: string,
) {
  const breakdown = await getDetailedApplicationBreakdown(month, year);
  const total = breakdown.total;
  const resumeRate = breakdown.resumeConversion;
  const interviewRate = breakdown.interviewConversion;
  const totalInterviews = breakdown.stages.interview;

  if (total === 0) {
    return {
      status: "empty" as const,
      stage: "No Data",
      headline: "Pipeline Awaiting Applications",
      description:
        "Track job applications to identify where candidates drop off in your funnel.",
      actionAdvice: "Add your active applications to begin funnel analysis.",
      health: "neutral" as const,
    };
  }

  if (total < 5) {
    return {
      status: "gathering" as const,
      stage: "Gathering Data",
      headline: `${total} ${total === 1 ? "Application" : "Applications"} Tracked`,
      description:
        "Add 5–10 applications to calculate statistically meaningful bottleneck diagnostics.",
      actionAdvice:
        "Keep tracking your applications to unlock funnel bottleneck insights.",
      health: "neutral" as const,
    };
  }

  if (resumeRate < 15) {
    return {
      status: "resume_bottleneck" as const,
      stage: "Resume Screening",
      headline: "Resume Pass Rate Below Benchmark",
      description: `Your resume screening pass rate is ${resumeRate.toFixed(1)}% (market benchmark: 15.0%–25.0%).`,
      actionAdvice:
        "Tailor keyword matches on resumes and review bullet point impact metrics.",
      health: "warning" as const,
    };
  }

  if (totalInterviews >= 2 && interviewRate < 20) {
    return {
      status: "interview_bottleneck" as const,
      stage: "Interview Stage",
      headline: "Interview-to-Offer Drop-Off",
      description: `Strong resume screening (${resumeRate.toFixed(1)}%), but interview conversion is ${interviewRate.toFixed(1)}% (benchmark: 20.0%–35.0%).`,
      actionAdvice:
        "Focus on behavioral storytelling (STAR method) and deep technical prep.",
      health: "warning" as const,
    };
  }

  return {
    status: "healthy" as const,
    stage: "Pipeline Healthy",
    headline: "Balanced Funnel Throughput",
    description: `Resume pass rate (${resumeRate.toFixed(1)}%) and interview rate (${interviewRate.toFixed(1)}%) are meeting target benchmarks.`,
    actionAdvice:
      "Pipeline is healthy. Maintain current application pacing and quality.",
    health: "healthy" as const,
  };
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

      const platformStats = new Map<
        string,
        { name: string; total: number; interviews: number }
      >();

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
          appHistory.some((h) =>
            didReachInterviewStage(h.status, h.statusCategory),
          );

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

      const bestPlatform =
        platformsWithRates.length > 0 ? platformsWithRates[0] : null;
      const secondBest =
        platformsWithRates.length > 1 ? platformsWithRates[1] : null;
      const multiplier =
        bestPlatform && secondBest && secondBest.interviewRate > 0
          ? bestPlatform.interviewRate / secondBest.interviewRate
          : 1;

      return { bestPlatform, secondBest, multiplier };
    },
    [
      "analytics",
      "best-platform-insight",
      userId,
      month || "all",
      year || "all",
    ],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    },
  )();
}
