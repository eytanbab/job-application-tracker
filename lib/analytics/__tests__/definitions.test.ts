import { describe, expect, it } from "vitest";
import {
  ghostsAt,
  platformKey,
  reachedInterview,
  responded,
  workMode,
} from "../definitions";
import { hist } from "./fixtures";

const ghostedNow = { status: "Ghosted", statusCategory: "ghosted" };

describe("reachedInterview / responded", () => {
  it("counts an interview that later went quiet as interviewed and responded", () => {
    const history = [hist("a", "applied", "2026-09-01"), hist("a", "interview", "2026-09-08")];
    expect(reachedInterview(ghostedNow, history)).toBe(true);
    expect(responded(ghostedNow, history)).toBe(true);
  });

  it("treats In Review as a response but not an interview", () => {
    const review = { status: "In Review", statusCategory: "review" };
    expect(responded(review, [])).toBe(true);
    expect(reachedInterview(review, [])).toBe(false);
  });

  it("recognizes free-text interview statuses in another category", () => {
    const screen = { status: "Phone screen booked", statusCategory: "other" };
    expect(reachedInterview(screen, [])).toBe(true);
    expect(responded(screen, [])).toBe(true);
  });

  it("does not count applied or ghosted-from-applied as a response", () => {
    const history = [hist("a", "applied", "2026-09-01"), hist("a", "ghosted", "2026-10-01")];
    expect(responded(ghostedNow, history)).toBe(false);
  });
});

describe("workMode", () => {
  it.each([
    ["Remote (US)", "remote"],
    ["WFH", "remote"],
    ["Hybrid - Tel Aviv", "hybrid"],
    ["Flexible", "hybrid"],
    ["New York, NY", "onsite"],
    ["", "unknown"],
    ["  N/A ", "unknown"],
    ["tbd", "unknown"],
  ])("%s -> %s", (location, expected) => {
    expect(workMode(location)).toBe(expected);
  });
});

describe("platformKey", () => {
  it("matches the tracker's platform filter normalization", () => {
    expect(platformKey("  LinkedIn ")).toBe("linkedin");
    expect(platformKey(null)).toBe("");
  });
});

describe("ghostsAt", () => {
  const applied = { status: "Applied", statusCategory: "applied", dateApplied: "2026-09-01" };

  it("is 30 days after applying when nothing else happened", () => {
    expect(new Date(ghostsAt(applied, [])!).getDate()).toBe(1);
    expect(new Date(ghostsAt(applied, [])!).getMonth()).toBe(9); // 1 Oct
  });

  it("moves later when the status changed recently", () => {
    const due = ghostsAt(applied, [hist("a", "review", "2026-09-20")]);
    expect(new Date(due!).toISOString().slice(0, 10)).toBe("2026-10-20");
  });

  it("is null for statuses the sync never touches", () => {
    expect(ghostsAt({ ...applied, statusCategory: "interview", status: "Interview" }, [])).toBeNull();
  });
});
