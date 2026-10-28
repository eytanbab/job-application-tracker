import {
  SEED_APPLICATIONS,
  SEED_STATUS_HISTORY,
  MockApplication,
  MockStatusHistory,
} from "./mock-applications";
import { SEED_DOCUMENTS, MockDocument } from "./mock-documents";
import { ghostsAt } from "@/lib/analytics/definitions";
import { clampBetweenNeighbours } from "@/lib/applications/history";
import type { AnalyticsDataset } from "@/lib/analytics/types";
import type { UserPreferences } from "@/lib/preference-options";

class MockStore {
  private applications: MockApplication[] = [];
  private statusHistory: MockStatusHistory[] = [];
  private documents: MockDocument[] = [];
  private preferences = new Map<string, UserPreferences>();
  private initialized = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.applications = SEED_APPLICATIONS.map((app) => ({ ...app }));
    this.statusHistory = SEED_STATUS_HISTORY.map((h) => ({ ...h }));
    this.documents = SEED_DOCUMENTS.map((doc) => ({ ...doc }));
    this.preferences = new Map();
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
    /** When the first status was reached; defaults to now. */
    statusAt?: Date,
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
      createdAt: statusAt ?? now,
    });

    return newApp;
  }

  public updateApplication(
    userId: string,
    id: string,
    updates: Partial<MockApplication>,
    /** When a status change happened; defaults to now. */
    statusAt?: Date,
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
        id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        applicationId: id,
        status: updatedApp.status,
        statusCategory: updatedApp.statusCategory,
        createdAt: statusAt ?? new Date(),
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
      (h) =>
        h.statusCategory === "applied" ||
        h.statusCategory === "saved" ||
        h.status.toLowerCase().includes("applied"),
    );
    if (!hasApplied && app.date_applied && app.statusCategory !== "saved") {
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

  public updateStatusHistoryDate(
    userId: string,
    historyId: string,
    requested: Date,
  ): { createdAt: Date } {
    const entry = this.statusHistory.find((h) => h.id === historyId);
    if (!entry) throw new Error("Timeline entry not found or unauthorized");
    const siblings = this.statusHistory.filter(
      (h) => h.applicationId === entry.applicationId,
    );
    entry.createdAt = clampBetweenNeighbours(siblings, historyId, requested);
    return { createdAt: entry.createdAt };
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
    this.applications = this.applications.map((app) =>
      app.resumeId === id ? { ...app, resumeId: null } : app,
    );
    return this.documents.length < prev;
  }

  public getDocumentUsage(
    userId: string,
    id: string,
  ): {
    count: number;
    applications: { id: string; role_name: string; company_name: string }[];
  } {
    const matches = this.applications.filter(
      (a) => a.resumeId === id && (!userId || a.userId === userId),
    );
    return {
      count: matches.length,
      applications: matches.map((m) => ({
        id: m.id,
        role_name: m.role_name,
        company_name: m.company_name,
      })),
    };
  }

  public getViewUrl(userId: string, id: string): { url: string } {
    return {
      url: `data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA2MTIgNzkyXS9QYXJlbnQgMiAwIFI+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PSpzdGFydHhyZWYKMTgzCiUlRU9G`,
    };
  }

  public getDownloadUrl(userId: string, id: string): { url: string } {
    return this.getViewUrl(userId, id);
  }

  // --- ACCOUNT DATA ---

  // The mock store is single-tenant: every visitor sees every row (see
  // getApplications/getDocuments), so a user's export and deletion cover
  // everything they can see.
  public exportUserData(userId: string): {
    applications: MockApplication[];
    statusHistory: MockStatusHistory[];
    documents: MockDocument[];
    preferences: UserPreferences | null;
  } {
    return {
      applications: this.applications.map((a) => ({ ...a })),
      statusHistory: this.statusHistory.map((h) => ({ ...h })),
      documents: this.documents.map((d) => ({ ...d })),
      preferences: this.getPreferences(userId),
    };
  }

  public getPreferences(userId: string): UserPreferences | null {
    const prefs = this.preferences.get(userId);
    return prefs ? { ...prefs } : null;
  }

  public setPreferences(userId: string, patch: Partial<UserPreferences>): UserPreferences {
    const next = {
      weeklyApplicationGoal: null,
      salaryCurrency: null,
      ...this.preferences.get(userId),
      ...patch,
    };
    this.preferences.set(userId, next);
    return { ...next };
  }

  public deleteUserData(userId: string): {
    applications: number;
    documents: number;
    fileKeys: string[];
  } {
    const result = {
      applications: this.applications.length,
      documents: this.documents.length,
      fileKeys: this.documents.map((d) => d.file_key),
    };
    this.applications = [];
    this.statusHistory = [];
    this.documents = [];
    this.preferences = new Map();
    return result;
  }

  /** Latest activity per row owner, for the guest retention job. */
  public getOwnerActivity(): { ownerId: string; lastActivity: Date }[] {
    const latest = new Map<string, Date>();
    const bump = (ownerId: string, at: Date) => {
      const prev = latest.get(ownerId);
      if (!prev || at > prev) latest.set(ownerId, at);
    };
    const ownerByApp = new Map(this.applications.map((a) => [a.id, a.userId]));

    this.applications.forEach((a) => bump(a.userId, new Date(a.createdAt)));
    this.statusHistory.forEach((h) => {
      const ownerId = ownerByApp.get(h.applicationId);
      if (ownerId) bump(ownerId, new Date(h.createdAt));
    });
    this.documents.forEach((d) => bump(d.userId, new Date(d.created_at)));

    return [...latest].map(([ownerId, lastActivity]) => ({
      ownerId,
      lastActivity,
    }));
  }

  /** Deletes only rows owned by ownerId (used by the retention job). */
  public deleteOwnerData(ownerId: string): {
    applications: number;
    documents: number;
    fileKeys: string[];
  } {
    const appIds = new Set(
      this.applications.filter((a) => a.userId === ownerId).map((a) => a.id),
    );
    const docs = this.documents.filter((d) => d.userId === ownerId);
    const docIds = new Set(docs.map((d) => d.id));

    this.applications = this.applications
      .filter((a) => !appIds.has(a.id))
      .map((a) =>
        a.resumeId && docIds.has(a.resumeId) ? { ...a, resumeId: null } : a,
      );
    this.statusHistory = this.statusHistory.filter(
      (h) => !appIds.has(h.applicationId),
    );
    this.documents = this.documents.filter((d) => !docIds.has(d.id));
    this.preferences.delete(ownerId);

    return {
      applications: appIds.size,
      documents: docs.length,
      fileKeys: docs.map((d) => d.file_key),
    };
  }

  /** Same rule as the database sync: 30 days with no application or status activity. */
  public syncGhostedApplications(userId?: string): number {
    const now = new Date();
    let count = 0;
    this.applications.forEach((app) => {
      const history = this.statusHistory.filter((h) => h.applicationId === app.id);
      const due = ghostsAt(
        {
          status: app.status,
          statusCategory: app.statusCategory,
          dateApplied: app.date_applied,
        },
        history.map((h) => ({ createdAt: new Date(h.createdAt).getTime() })),
      );
      if (due === null || due > now.getTime()) return;

      app.status = "Ghosted";
      app.statusCategory = "ghosted";
      if (!history.some((h) => h.statusCategory === "ghosted")) {
        // Dated when it became due, after the last activity (already <= now).
        this.statusHistory.unshift({
          id: `hist-ghost-${app.id}`,
          applicationId: app.id,
          status: "Ghosted",
          statusCategory: "ghosted",
          createdAt: new Date(due),
        });
      }
      count++;
    });
    return count;
  }

  /** Every application and status change, in the shape the analytics layer reads. */
  public getAnalyticsDataset(userId?: string): AnalyticsDataset {
    return {
      apps: this.getApplications(userId).map((app) => ({
        id: app.id,
        role: app.role_name,
        company: app.company_name,
        platform: app.platform,
        status: app.status,
        statusCategory: app.statusCategory,
        location: app.location,
        dateApplied: app.date_applied,
        createdAt: new Date(app.createdAt).getTime(),
        salary: app.salary,
        resumeId: app.resumeId ?? null,
        resumeTitle: app.resumeTitle ?? null,
      })),
      history: this.statusHistory.map((h) => ({
        applicationId: h.applicationId,
        status: h.status,
        statusCategory: h.statusCategory,
        createdAt: new Date(h.createdAt).getTime(),
      })),
    };
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
}

// Global singleton instance for the development Node process
const globalForMock = global as unknown as { mockStore?: MockStore };
export const mockStore = globalForMock.mockStore || new MockStore();
if (process.env.NODE_ENV !== "production") globalForMock.mockStore = mockStore;
