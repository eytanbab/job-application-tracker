import {
  SEED_APPLICATIONS,
  SEED_STATUS_HISTORY,
  MockApplication,
  MockStatusHistory,
} from "./mock-applications";
import { SEED_DOCUMENTS, MockDocument } from "./mock-documents";
import {
  getStatusKind,
  statusLabels,
  didReachInterviewStage,
  extractRootDomain,
  formatApplicationsPerYear,
  StatusKind,
} from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

class MockStore {
  private applications: MockApplication[] = [];
  private statusHistory: MockStatusHistory[] = [];
  private documents: MockDocument[] = [];
  private initialized = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.applications = SEED_APPLICATIONS.map((app) => ({ ...app }));
    this.statusHistory = SEED_STATUS_HISTORY.map((h) => ({ ...h }));
    this.documents = SEED_DOCUMENTS.map((doc) => ({ ...doc }));
    this.initialized = true;
  }

  // --- APPLICATIONS ---

  public getApplications(userId?: string): (MockApplication & {
    resumeTitle?: string | null;
    resumeFileName?: string | null;
    resumeFileSize?: string | null;
  })[] {
    return [...this.applications]
      .sort((a, b) => {
        const dateA = new Date(a.date_applied).getTime();
        const dateB = new Date(b.date_applied).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((app) => {
        const doc = app.resumeId
          ? this.documents.find((d) => d.id === app.resumeId)
          : null;
        return {
          ...app,
          resumeTitle: doc?.title ?? null,
          resumeFileName: doc?.file_name ?? null,
          resumeFileSize: doc?.file_size ?? null,
        };
      });
  }

  public createApplication(
    userId: string,
    data: Omit<MockApplication, "id" | "userId" | "createdAt">,
  ): MockApplication {
    const id = `app-mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const newApp: MockApplication = {
      ...data,
      id,
      userId: userId || "mock-dev-user",
      createdAt: now,
    };
    this.applications.unshift(newApp);

    // Initial status history
    this.statusHistory.unshift({
      id: `hist-${Date.now()}`,
      applicationId: id,
      status: data.status,
      statusCategory: data.statusCategory || "applied",
      createdAt: now,
    });

    return newApp;
  }

  public updateApplication(
    userId: string,
    id: string,
    updates: Partial<MockApplication>,
  ): MockApplication | null {
    const index = this.applications.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const current = this.applications[index];
    const statusChanged =
      (updates.status && updates.status !== current.status) ||
      (updates.statusCategory && updates.statusCategory !== current.statusCategory);

    const updatedApp: MockApplication = {
      ...current,
      ...updates,
      id: current.id,
      userId: current.userId,
    };
    this.applications[index] = updatedApp;

    if (statusChanged) {
      this.statusHistory.unshift({
        id: `hist-${Date.now()}`,
        applicationId: id,
        status: updatedApp.status,
        statusCategory: updatedApp.statusCategory,
        createdAt: new Date(),
      });
    }

    return updatedApp;
  }

  public deleteApplication(userId: string, id: string): boolean {
    const prevLen = this.applications.length;
    this.applications = this.applications.filter((a) => a.id !== id);
    this.statusHistory = this.statusHistory.filter((h) => h.applicationId !== id);
    return this.applications.length < prevLen;
  }

  public getApplicationHistory(userId: string, applicationId: string): MockStatusHistory[] {
    const app = this.applications.find((a) => a.id === applicationId);
    if (!app) return [];

    const hist = this.statusHistory
      .filter((h) => h.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Backfill initial applied history if missing
    const hasApplied = hist.some(
      (h) => h.statusCategory === "applied" || h.status.toLowerCase().includes("applied"),
    );
    if (!hasApplied && app.date_applied) {
      hist.push({
        id: `hist-applied-${app.id}`,
        applicationId,
        status: "Applied",
        statusCategory: "applied",
        createdAt: new Date(app.date_applied),
      });
    }

    return hist.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteStatusHistoryEntry(
    userId: string,
    historyId: string,
  ): { status: string; statusCategory: string } {
    const entry = this.statusHistory.find((h) => h.id === historyId);
    if (!entry) {
      return { status: "Applied", statusCategory: "applied" };
    }

    const { applicationId } = entry;
    this.statusHistory = this.statusHistory.filter((h) => h.id !== historyId);

    const remaining = this.statusHistory
      .filter((h) => h.applicationId === applicationId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let newStatus = "Applied";
    let newCategory = "applied";

    if (remaining.length > 0) {
      newStatus = remaining[0].status;
      newCategory = remaining[0].statusCategory;
    }

    const appIndex = this.applications.findIndex((a) => a.id === applicationId);
    if (appIndex !== -1) {
      this.applications[appIndex] = {
        ...this.applications[appIndex],
        status: newStatus,
        statusCategory: newCategory,
      };
    }

    return { status: newStatus, statusCategory: newCategory };
  }

  // --- DOCUMENTS ---

  public getDocuments(userId?: string): MockDocument[] {
    return [...this.documents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  public createDocument(
    userId: string,
    data: Omit<MockDocument, "id" | "userId" | "created_at">,
  ): MockDocument {
    const id = `doc-mock-${Date.now()}`;
    const newDoc: MockDocument = {
      ...data,
      id,
      userId: userId || "mock-dev-user",
      created_at: new Date(),
    };
    this.documents.unshift(newDoc);
    return newDoc;
  }

  public deleteDocument(userId: string, id: string): boolean {
    const prev = this.documents.length;
    this.documents = this.documents.filter((d) => d.id !== id);
    return this.documents.length < prev;
  }

  public getViewUrl(userId: string, id: string): { url: string } {
    return {
      url: `data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFI+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PSpzdGFydHhyZWYKMTgzCiUlRU9G`,
    };
  }

  public getDownloadUrl(userId: string, id: string): { url: string } {
    return this.getViewUrl(userId, id);
  }

  // --- ANALYTICS QUERIES ---

  private filterApps(month?: string, year?: string): MockApplication[] {
    return this.applications.filter((a) => {
      if (year && year !== "all" && a.year !== year) return false;
      if (month && month !== "all" && a.month !== month) return false;
      return true;
    });
  }

  public getYears(): string[] {
    const years = Array.from(new Set(this.applications.map((a) => a.year)));
    return years.sort((a, b) => b.localeCompare(a));
  }

  public getTop5Statuses(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const counts: Record<string, number> = {};

    apps.forEach((a) => {
      const kind = getStatusKind(null, a.statusCategory);
      const label = statusLabels[kind] || kind;
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, freq]) => ({ name, freq }))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, 5);
  }

  public getGhostedApplications(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const now = new Date();

    const ghostedApps: MockApplication[] = [];
    const followUpApps: MockApplication[] = [];
    const ghostedCompanyMap = new Map<string, number>();
    const followUpCompanyMap = new Map<string, number>();
    let oldestDays = 0;

    apps.forEach((app) => {
      const kind = getStatusKind(app.status, app.statusCategory);
      if (!app.date_applied) return;
      const appliedDate = parseISO(app.date_applied);
      if (isNaN(appliedDate.getTime())) return;

      const daysAgo = differenceInDays(now, appliedDate);

      const isGhosted =
        kind === "ghosted" || ((kind === "applied" || kind === "review") && daysAgo >= 30);

      if (isGhosted) {
        ghostedApps.push(app);
        const name = (app.company_name || "").trim();
        if (name) ghostedCompanyMap.set(name, (ghostedCompanyMap.get(name) || 0) + 1);
        if (daysAgo > oldestDays) oldestDays = daysAgo;
      }

      if ((kind === "applied" || kind === "review") && daysAgo >= 7 && daysAgo <= 14) {
        followUpApps.push(app);
        const name = (app.company_name || "").trim();
        if (name) followUpCompanyMap.set(name, (followUpCompanyMap.get(name) || 0) + 1);
      }
    });

    const topGhostedCompanies = Array.from(ghostedCompanyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    const topFollowUpCompanies = Array.from(followUpCompanyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);

    const followUpQueue = followUpApps.slice(0, 10).map((app) => ({
      id: app.id,
      company: (app.company_name || "").trim(),
      role: (app.role_name || "").trim(),
      daysAgo: differenceInDays(now, new Date(app.date_applied)),
      dateApplied: app.date_applied,
    }));

    const unansweredQueue = ghostedApps.slice(0, 10).map((app) => ({
      id: app.id,
      company: (app.company_name || "").trim(),
      role: (app.role_name || "").trim(),
      daysAgo: differenceInDays(now, new Date(app.date_applied)),
      dateApplied: app.date_applied,
    }));

    return {
      count: ghostedApps.length,
      companies: topGhostedCompanies,
      oldestDays,
      followUpCount: followUpApps.length,
      followUpCompanies: topFollowUpCompanies,
      followUpQueue,
      unansweredQueue,
    };
  }

  public getApplicationsPerYear(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const map = new Map<string, number>();

    apps.forEach((a) => {
      const key = `${a.year}-${a.month}`;
      map.set(key, (map.get(key) || 0) + 1);
    });

    const list = Array.from(map.entries()).map(([key, count]) => {
      const [y, m] = key.split("-");
      return {
        year: y,
        month: m,
        numOfApplications: count,
      };
    });

    return formatApplicationsPerYear(list);
  }

  public getStasusesPerYear(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const map = new Map<string, number>();

    apps.forEach((a) => {
      const kind = getStatusKind(null, a.statusCategory);
      const label = statusLabels[kind] || kind;
      const key = `${a.year}-${a.month}-${label}`;
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).map(([key, count]) => {
      const [y, m, label] = key.split("-");
      return {
        year: y,
        month: m,
        status: label,
        statusCount: count,
      };
    });
  }

  public getDomainLeaderboard(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const domainStats: Record<string, { total: number; interviews: number }> = {};

    apps.forEach((app) => {
      if (!app.link) return;
      try {
        const rawUrl =
          app.link.startsWith("http://") || app.link.startsWith("https://")
            ? app.link
            : `https://${app.link}`;
        const url = new URL(rawUrl);
        const domain = extractRootDomain(url.hostname);

        if (!domainStats[domain]) {
          domainStats[domain] = { total: 0, interviews: 0 };
        }
        domainStats[domain].total++;
        if (didReachInterviewStage(app.status, app.statusCategory)) {
          domainStats[domain].interviews++;
        }
      } catch {
        // Skip invalid url
      }
    });

    return Object.entries(domainStats)
      .map(([domain, stats]) => ({
        domain,
        ...stats,
        successRate: stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate || b.total - a.total)
      .slice(0, 5);
  }

  public getStatusPerPlatform(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const platformMap = new Map<
      string,
      {
        platformName: string;
        statusCounts: Map<string, number>;
        total: number;
        interviewCount: number;
      }
    >();

    apps.forEach((app) => {
      const trimmed = (app.platform || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();

      if (!platformMap.has(key)) {
        platformMap.set(key, {
          platformName: trimmed,
          statusCounts: new Map(),
          total: 0,
          interviewCount: 0,
        });
      }

      const entry = platformMap.get(key)!;
      entry.total++;

      const history = this.statusHistory.filter((h) => h.applicationId === app.id);
      const reachedInterview =
        didReachInterviewStage(app.status, app.statusCategory) ||
        history.some((h) => didReachInterviewStage(h.status, h.statusCategory));

      if (reachedInterview) entry.interviewCount++;

      const kind = getStatusKind(app.status, app.statusCategory);
      entry.statusCounts.set(kind, (entry.statusCounts.get(kind) || 0) + 1);
    });

    return Array.from(platformMap.values())
      .sort((a, b) => b.total - a.total)
      .map(({ platformName, statusCounts, total, interviewCount }) => ({
        platformName,
        statuses: Array.from(statusCounts.entries())
          .map(([kind, value]) => ({ status: kind, value }))
          .sort((a, b) => b.value - a.value),
        total,
        interviewCount,
      }));
  }

  public getDetailedApplicationBreakdown(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    if (apps.length === 0) {
      return {
        total: 0,
        stages: { applied: 0, interview: 0, accepted: 0 },
        breakdown: {
          active: 0,
          activeStages: { applied: 0, review: 0, interview: 0 },
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

    let activeCount = 0;
    let activeApplied = 0;
    let activeReview = 0;
    let activeInterview = 0;
    let offered = 0;
    let rejectedResume = 0;
    let rejectedInterview = 0;
    let ghostedResume = 0;
    let ghostedInterview = 0;

    let totalResponseDays = 0;
    let totalResponseCount = 0;

    apps.forEach((app) => {
      const history = this.statusHistory.filter((h) => h.applicationId === app.id);
      const reachedInterview =
        didReachInterviewStage(app.status, app.statusCategory) ||
        history.some((h) => didReachInterviewStage(h.status, h.statusCategory));

      const kind = getStatusKind(app.status, app.statusCategory);

      if (kind === "accepted") {
        offered++;
      } else if (kind === "rejected") {
        if (reachedInterview) rejectedInterview++;
        else rejectedResume++;
      } else if (kind === "ghosted") {
        if (reachedInterview) ghostedInterview++;
        else ghostedResume++;
      } else {
        activeCount++;
        if (kind === "applied") activeApplied++;
        else if (kind === "review") activeReview++;
        else if (kind === "interview") activeInterview++;
        else activeApplied++;
      }

      if (kind !== "ghosted") {
        const firstResponse = history
          .filter((h) => {
            const k = getStatusKind(h.status, h.statusCategory);
            return k !== "applied" && k !== "ghosted";
          })
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

        if (firstResponse && app.date_applied) {
          const appliedDate = parseISO(app.date_applied);
          const diff = differenceInDays(new Date(firstResponse.createdAt), appliedDate);
          if (diff >= 0 && diff <= 60) {
            totalResponseDays += diff;
            totalResponseCount++;
          }
        }
      }
    });

    const uniqueApplied = apps.length;
    const uniqueInterview = apps.filter((app) => {
      const history = this.statusHistory.filter((h) => h.applicationId === app.id);
      return (
        didReachInterviewStage(app.status, app.statusCategory) ||
        history.some((h) => didReachInterviewStage(h.status, h.statusCategory))
      );
    }).length;
    const uniqueOffer = offered;

    const resumeConversion = uniqueApplied ? (uniqueInterview / uniqueApplied) * 100 : 0;
    const interviewConversion = uniqueInterview ? (uniqueOffer / uniqueInterview) * 100 : 0;
    const responseConversion = uniqueApplied
      ? ((uniqueInterview + rejectedResume) / uniqueApplied) * 100
      : 0;

    const averageResponseDays =
      totalResponseCount > 0 ? Math.round(totalResponseDays / totalResponseCount) : 7;

    return {
      total: apps.length,
      stages: {
        applied: uniqueApplied,
        interview: uniqueInterview,
        accepted: uniqueOffer,
      },
      breakdown: {
        active: activeCount,
        activeStages: {
          applied: activeApplied,
          review: activeReview,
          interview: activeInterview,
        },
        offered,
        rejectedResume,
        rejectedInterview,
        ghostedResume,
        ghostedInterview,
      },
      resumeConversion,
      interviewConversion,
      responseConversion,
      averageResponseDays,
    };
  }

  public getWorkModeAnalysis(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const modes = {
      remote: { name: "Remote", total: 0, interviews: 0 },
      hybrid: { name: "Hybrid", total: 0, interviews: 0 },
      onsite: { name: "On-site", total: 0, interviews: 0 },
    };

    apps.forEach((app) => {
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

    const totalApps = apps.length;
    return Object.values(modes).map((m) => ({
      ...m,
      sharePct: totalApps > 0 ? (m.total / totalApps) * 100 : 0,
      yieldRate: m.total > 0 ? (m.interviews / m.total) * 100 : 0,
    }));
  }

  public getSalaryInsights(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const parsed: { val: number; raw: string; role: string; company: string }[] = [];

    apps.forEach((app) => {
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
          const midpoint = nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
          parsed.push({
            val: midpoint,
            raw: app.salary,
            role: app.role_name,
            company: app.company_name,
          });
        }
      }
    });

    if (parsed.length === 0) {
      return {
        statedCount: 0,
        totalCount: apps.length,
        minSalary: null,
        maxSalary: null,
        avgSalary: null,
      };
    }

    parsed.sort((a, b) => b.val - a.val);
    const values = parsed.map((p) => p.val);
    const minSalary = Math.min(...values);
    const maxSalary = Math.max(...values);
    const avgSalary = Math.round(values.reduce((acc, curr) => acc + curr, 0) / values.length);
    const topItem = parsed[0];

    return {
      statedCount: parsed.length,
      totalCount: apps.length,
      minSalary,
      maxSalary,
      avgSalary,
      topRole: topItem.role,
      topCompany: topItem.company,
      topSalaryFormatted: topItem.raw,
    };
  }

  public syncGhostedApplications(userId?: string): number {
    const now = new Date();
    let count = 0;
    this.applications.forEach((app) => {
      const kind = getStatusKind(app.status, app.statusCategory);
      if (kind === "applied" || kind === "review") {
        if (app.date_applied) {
          const appliedDate = parseISO(app.date_applied);
          if (!isNaN(appliedDate.getTime())) {
            const daysAgo = differenceInDays(now, appliedDate);
            if (daysAgo >= 30) {
              app.status = "Ghosted";
              app.statusCategory = "ghosted";
              this.statusHistory.unshift({
                id: `hist-ghost-${app.id}`,
                applicationId: app.id,
                status: "Ghosted",
                statusCategory: "ghosted",
                createdAt: now,
              });
              count++;
            }
          }
        }
      }
    });
    return count;
  }

  public getDistinctLocationsAndPlatforms(userId?: string): {
    userLocations: string[];
    userPlatforms: string[];
  } {
    const locs = Array.from(
      new Set(
        this.applications
          .map((a) => a.location?.trim())
          .filter((l): l is string => Boolean(l)),
      ),
    );
    const plats = Array.from(
      new Set(
        this.applications
          .map((a) => a.platform?.trim())
          .filter((p): p is string => Boolean(p)),
      ),
    );
    return { userLocations: locs, userPlatforms: plats };
  }

  public getBestPlatformInsight(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const platformStats = new Map<
      string,
      { name: string; total: number; interviews: number }
    >();

    apps.forEach((app) => {
      const trimmed = (app.platform || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();

      if (!platformStats.has(key)) {
        platformStats.set(key, { name: trimmed, total: 0, interviews: 0 });
      }
      const stats = platformStats.get(key)!;
      stats.total++;

      const hist = this.statusHistory.filter((h) => h.applicationId === app.id);
      if (
        didReachInterviewStage(app.status, app.statusCategory) ||
        hist.some((h) => didReachInterviewStage(h.status, h.statusCategory))
      ) {
        stats.interviews++;
      }
    });

    const platformsWithRates = Array.from(platformStats.values()).map((p) => ({
      ...p,
      interviewRate: p.total > 0 ? (p.interviews / p.total) * 100 : 0,
    }));

    const significantPlatforms = platformsWithRates
      .filter((p) => p.total >= 3)
      .sort((a, b) => b.interviewRate - a.interviewRate || b.total - a.total);

    const allSorted = [...platformsWithRates].sort(
      (a, b) => b.interviewRate - a.interviewRate || b.total - a.total,
    );

    const bestPlatform =
      significantPlatforms.length > 0
        ? significantPlatforms[0]
        : allSorted.length > 0
          ? allSorted[0]
          : null;

    const secondBest =
      significantPlatforms.length > 1
        ? significantPlatforms[1]
        : allSorted.length > 1 && allSorted[1].name !== bestPlatform?.name
          ? allSorted[1]
          : null;

    const multiplier =
      bestPlatform && secondBest && secondBest.interviewRate > 0
        ? bestPlatform.interviewRate / secondBest.interviewRate
        : 1;

    return { bestPlatform, secondBest, multiplier };
  }

  public getPlatformRoi(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const platforms: Record<string, { total: number; interviews: number }> = {};

    apps.forEach((app) => {
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
        yieldRate: stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  public getBlackHoleBreakdown(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    let ghosted = 0;
    let rejected = 0;

    apps.forEach((app) => {
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
  }

  public getRoleTargetingAnalysis(month?: string, year?: string) {
    const apps = this.filterApps(month, year);
    const roles: Record<string, number> = {};

    apps.forEach((app) => {
      let role = app.role_name.toLowerCase().trim();
      if (role.includes("frontend") || role.includes("front end"))
        role = "Frontend Developer";
      else if (role.includes("backend") || role.includes("back end"))
        role = "Backend Developer";
      else if (role.includes("fullstack") || role.includes("full stack"))
        role = "Fullstack Developer";
      else if (role.includes("product designer") || role.includes("ui/ux"))
        role = "Product Designer";
      else if (role.length > 20) role = role.substring(0, 20) + "...";

      roles[role] = (roles[role] || 0) + 1;
    });

    return Object.entries(roles)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Global singleton instance for the development Node process
const globalForMock = global as unknown as { mockStore?: MockStore };
export const mockStore = globalForMock.mockStore || new MockStore();
if (process.env.NODE_ENV !== "production") globalForMock.mockStore = mockStore;
