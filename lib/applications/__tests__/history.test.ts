import { describe, expect, it } from "vitest";
import { clampBetweenNeighbours, statusChangeTime } from "../history";

const entries = [
  { id: "applied", createdAt: new Date("2026-10-01T10:00:00Z") },
  { id: "review", createdAt: new Date("2026-10-10T10:00:00Z") },
  { id: "interview", createdAt: new Date("2026-10-20T10:00:00Z") },
];

describe("clampBetweenNeighbours", () => {
  it("keeps a date that fits between the neighbours", () => {
    const when = new Date("2026-10-05T12:00:00Z");
    expect(clampBetweenNeighbours(entries, "review", when)).toEqual(when);
  });

  it("holds an entry after the one before it", () => {
    expect(
      clampBetweenNeighbours(entries, "review", new Date("2026-09-01T00:00:00Z")),
    ).toEqual(new Date("2026-10-01T10:00:01Z"));
  });

  it("holds an entry before the one after it", () => {
    expect(
      clampBetweenNeighbours(entries, "review", new Date("2026-10-25T00:00:00Z")),
    ).toEqual(new Date("2026-10-20T09:59:59Z"));
  });

  it("lets the newest entry move freely forward", () => {
    const when = new Date("2026-10-27T12:00:00Z");
    expect(clampBetweenNeighbours(entries, "interview", when)).toEqual(when);
  });
});

describe("statusChangeTime", () => {
  const now = new Date("2026-10-28T12:00:00Z");

  it("defaults to now", () => {
    expect(statusChangeTime(null, { now })).toEqual(now);
  });

  it("uses a past date the user gave", () => {
    const when = new Date("2026-10-21T12:00:00Z");
    expect(statusChangeTime(when, { now })).toEqual(when);
  });

  it("never goes into the future or before the previous entry", () => {
    expect(statusChangeTime(new Date("2026-11-30T00:00:00Z"), { now })).toEqual(now);
    expect(
      statusChangeTime(new Date("2026-09-01T00:00:00Z"), {
        now,
        after: new Date("2026-10-10T10:00:00Z"),
      }),
    ).toEqual(new Date("2026-10-10T10:00:01Z"));
  });
});
