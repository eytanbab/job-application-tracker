import { describe, expect, it } from "vitest";
import { applyOptimisticChanges } from "../optimistic-changes";

const rows = [
  { id: "a", status: "Applied", statusCategory: "applied" },
  { id: "b", status: "Applied", statusCategory: "applied" },
  { id: "c", status: "Interview", statusCategory: "interview" },
];

describe("applyOptimisticChanges", () => {
  it("returns the same rows when nothing is pending", () => {
    expect(applyOptimisticChanges(rows, [])).toBe(rows);
  });

  it("removes pending deletes and applies pending moves", () => {
    const result = applyOptimisticChanges(rows, [
      { kind: "delete", id: "b" },
      { kind: "move", id: "a", statusCategory: "rejected", status: "Rejected" },
    ]);
    expect(result).toEqual([
      { id: "a", status: "Rejected", statusCategory: "rejected" },
      { id: "c", status: "Interview", statusCategory: "interview" },
    ]);
    expect(rows[0].status).toBe("Applied"); // input untouched
  });

  it("uses the latest move when a row moves twice", () => {
    const [row] = applyOptimisticChanges([rows[0]], [
      { kind: "move", id: "a", statusCategory: "review", status: "In Review" },
      { kind: "move", id: "a", statusCategory: "interview", status: "Interview" },
    ]);
    expect(row.statusCategory).toBe("interview");
  });
});
