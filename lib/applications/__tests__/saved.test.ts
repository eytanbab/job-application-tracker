import { describe, expect, it } from "vitest";
import { dateAfterStatusChange } from "../saved";

const today = new Date("2026-10-28T12:00:00");

describe("dateAfterStatusChange", () => {
  it("uses today when a saved job is sent with its saved date", () => {
    expect(
      dateAfterStatusChange({
        previousCategory: "saved",
        nextCategory: "applied",
        storedDate: "2026-10-01",
        nextDate: "2026-10-01",
        today,
      }),
    ).toBe("2026-10-28");
  });

  it("keeps a date the user picked in the same save", () => {
    expect(
      dateAfterStatusChange({
        previousCategory: "saved",
        nextCategory: "applied",
        storedDate: "2026-10-01",
        nextDate: "2026-10-20",
        today,
      }),
    ).toBe("2026-10-20");
  });

  it("leaves other status changes alone", () => {
    expect(
      dateAfterStatusChange({
        previousCategory: "applied",
        nextCategory: "interview",
        storedDate: "2026-10-01",
        nextDate: "2026-10-01",
        today,
      }),
    ).toBe("2026-10-01");
    expect(
      dateAfterStatusChange({
        previousCategory: "saved",
        nextCategory: "saved",
        storedDate: "2026-10-01",
        nextDate: "2026-10-01",
        today,
      }),
    ).toBe("2026-10-01");
  });
});
