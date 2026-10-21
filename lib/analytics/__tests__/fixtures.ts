import type { AnalyticsApp, AnalyticsDataset, AnalyticsHistory } from "../types";

export const TODAY = new Date(2026, 9, 21, 12); // 21 Oct 2026, local noon

const at = (iso: string) => new Date(`${iso}T12:00:00`).getTime();

export function app(overrides: Partial<AnalyticsApp> & { id: string }): AnalyticsApp {
  return {
    role: "Engineer",
    company: "Acme",
    platform: "LinkedIn",
    status: "Applied",
    statusCategory: "applied",
    location: "Remote",
    dateApplied: "2026-10-01",
    createdAt: at(overrides.dateApplied ?? "2026-10-01"),
    salary: null,
    resumeId: null,
    resumeTitle: null,
    ...overrides,
  };
}

export function hist(
  applicationId: string,
  statusCategory: string,
  isoDate: string,
  status = statusCategory,
): AnalyticsHistory {
  return { applicationId, status, statusCategory, createdAt: at(isoDate) };
}

/** Ten applications covering every metric edge case the page has to get right. */
export function sampleDataset(): AnalyticsDataset {
  const apps = [
    // Interviewed, then ghosted: counts as interviewed and responded.
    app({ id: "a1", status: "Ghosted", statusCategory: "ghosted", location: "Remote", dateApplied: "2026-09-01" }),
    // In review only: responded, not interviewed.
    app({ id: "a2", status: "In Review", statusCategory: "review", platform: "linkedin ", location: "Hybrid", dateApplied: "2026-09-05" }),
    // Offer.
    app({ id: "a3", status: "Offer", statusCategory: "accepted", platform: "Greenhouse", location: "Tel Aviv", dateApplied: "2026-09-10", salary: "$120k-$150k + 15% bonus", resumeId: "r1", resumeTitle: "Resume v2" }),
    // Rejected before interview.
    app({ id: "a4", status: "Rejected", statusCategory: "rejected", platform: "Greenhouse", location: "", dateApplied: "2026-09-12" }),
    // Rejected after interview.
    app({ id: "a5", status: "Rejected", statusCategory: "rejected", platform: "Indeed", location: "onsite NYC", dateApplied: "2026-09-15", salary: "180,000 USD + 401k" }),
    // Free-text phone screen with an "other" category.
    app({ id: "a6", status: "Phone screen booked", statusCategory: "other", platform: "Referral", location: "remote", dateApplied: "2026-09-20", salary: "€70,000" }),
    // Applied 10 days ago, no reply: needs a nudge.
    app({ id: "a7", status: "Applied", statusCategory: "applied", platform: "", location: "Remote", dateApplied: "2026-10-11", resumeId: "r1", resumeTitle: "Resume v2" }),
    // Applied 25 days ago: ghosts within 7 days.
    app({ id: "a8", status: "Applied", statusCategory: "applied", platform: "LinkedIn", dateApplied: "2026-09-26" }),
    // Interview with no update for 10 days.
    app({ id: "a9", status: "Interview", statusCategory: "interview", platform: "LinkedIn", dateApplied: "2026-09-25" }),
    // Previous period (August).
    app({ id: "a10", status: "Rejected", statusCategory: "rejected", platform: "LinkedIn", dateApplied: "2026-08-10" }),
  ];
  const history = [
    hist("a1", "applied", "2026-09-01"),
    hist("a1", "interview", "2026-09-08"),
    hist("a1", "ghosted", "2026-10-08"),
    hist("a2", "applied", "2026-09-05"),
    hist("a2", "review", "2026-09-09"),
    hist("a3", "applied", "2026-09-10"),
    hist("a3", "review", "2026-09-13"),
    hist("a3", "interview", "2026-09-20"),
    hist("a3", "accepted", "2026-10-05"),
    hist("a4", "applied", "2026-09-12"),
    hist("a4", "rejected", "2026-09-19"),
    hist("a5", "applied", "2026-09-15"),
    hist("a5", "interview", "2026-09-22"),
    hist("a5", "rejected", "2026-09-30"),
    hist("a6", "applied", "2026-09-20"),
    hist("a6", "other", "2026-09-27", "Phone screen booked"),
    hist("a7", "applied", "2026-10-11"),
    hist("a8", "applied", "2026-09-26"),
    hist("a9", "applied", "2026-09-25"),
    hist("a9", "interview", "2026-10-11"),
    hist("a10", "applied", "2026-08-10"),
    hist("a10", "rejected", "2026-08-20"),
  ];
  return { apps, history };
}
