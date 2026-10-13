import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatPlatformLabel,
  getStatusKind,
  isStandardStatus,
  mergeWithDefaultOptions,
  resolveUpdatedStatus,
  safeFormatDate,
  statusLabels,
  statusOptions,
} from "../utils";

describe("statusOptions", () => {
  it("lists every pipeline stage once, in pipeline order", () => {
    expect(statusOptions.map((option) => option.value)).toEqual([
      "applied",
      "review",
      "interview",
      "accepted",
      "rejected",
      "ghosted",
      "other",
    ]);
    expect(statusLabels.accepted).toBe("Accepted / Offer");
  });
});

describe("getStatusKind", () => {
  it("prefers a valid stored category over the free-text status", () => {
    expect(getStatusKind("Round 2 Technical", "interview")).toBe("interview");
    expect(getStatusKind("Rejected", "not-a-kind")).toBe("rejected");
  });

  it.each([
    ["Ghosted after onsite", "ghosted"],
    ["Rejected", "rejected"],
    ["Offer received", "accepted"],
    ["Accepted", "accepted"],
    ["Phone interview", "interview"],
    ["In Review", "review"],
    ["Applied", "applied"],
    ["Recruiter call", "other"],
    ["", "other"],
  ] as const)("infers %j as %s", (status, kind) => {
    expect(getStatusKind(status)).toBe(kind);
  });

  it("treats null and undefined as other", () => {
    expect(getStatusKind(null)).toBe("other");
    expect(getStatusKind(undefined)).toBe("other");
  });
});

describe("isStandardStatus", () => {
  it.each(["Applied", "in review", " Accepted / Offer ", "offer", "rejection", "", null, undefined])(
    "treats %j as a standard status",
    (status) => {
      expect(isStandardStatus(status)).toBe(true);
    },
  );

  it.each(["Recruiter Screen", "Round 2 Technical"])("treats %j as custom", (status) => {
    expect(isStandardStatus(status)).toBe(false);
  });
});

describe("resolveUpdatedStatus", () => {
  it("uses explicit status text, trimmed", () => {
    expect(resolveUpdatedStatus("Applied", "interview", "  Round 2  ")).toBe("Round 2");
  });

  it("falls back to the category label when explicit text is blank", () => {
    expect(resolveUpdatedStatus("Applied", "interview", "   ")).toBe("Interview");
  });

  it("replaces a standard status with the new category label", () => {
    expect(resolveUpdatedStatus("Applied", "review")).toBe("In Review");
    expect(resolveUpdatedStatus(null, "ghosted")).toBe("Ghosted");
  });

  it("keeps a custom label when the category does not change", () => {
    expect(resolveUpdatedStatus(" Recruiter Interview ", "interview")).toBe("Recruiter Interview");
  });

  it("drops a custom label when the category changes", () => {
    expect(resolveUpdatedStatus("Recruiter Interview", "rejected")).toBe("Rejected");
  });
});

describe("formatPlatformLabel", () => {
  it.each([
    ["linkedin", "LinkedIn"],
    ["  INDEED ", "Indeed"],
    ["company website", "Company Website"],
    ["greenhouse", "Greenhouse"],
    ["wellfound", "Wellfound"],
    ["SmartRecruiters", "SmartRecruiters"],
    ["", ""],
    [null, ""],
    [undefined, ""],
  ] as const)("formats %j as %j", (platform, label) => {
    expect(formatPlatformLabel(platform)).toBe(label);
  });
});

describe("safeFormatDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 9, 30));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes a yyyy-MM-dd string through unchanged", () => {
    expect(safeFormatDate("2025-02-28")).toBe("2025-02-28");
  });

  it("does not shift date-only strings across time zones", () => {
    expect(safeFormatDate("2025-03-01", "MMM d, yyyy")).toBe("Mar 1, 2025");
  });

  it("formats Date objects, timestamps and ISO strings", () => {
    expect(safeFormatDate(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(safeFormatDate(new Date(2024, 6, 4).getTime())).toBe("2024-07-04");
    expect(safeFormatDate("2024-12-31T15:00:00", "dd/MM/yyyy")).toBe("31/12/2024");
  });

  it.each([null, undefined, "", "   ", "not a date", Number.NaN, new Date("nope")])(
    "falls back to today for %j instead of throwing",
    (value) => {
      expect(safeFormatDate(value)).toBe("2026-10-13");
    },
  );
});

describe("mergeWithDefaultOptions", () => {
  it("puts user options first and de-duplicates case-insensitively", () => {
    expect(
      mergeWithDefaultOptions([" Wellfound ", "linkedin", ""], ["LinkedIn", "Indeed", "wellfound"]),
    ).toEqual(["Wellfound", "linkedin", "Indeed"]);
  });

  it("handles missing lists", () => {
    expect(mergeWithDefaultOptions(undefined, ["Remote"])).toEqual(["Remote"]);
    expect(mergeWithDefaultOptions()).toEqual([]);
  });
});
