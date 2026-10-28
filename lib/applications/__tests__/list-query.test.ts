import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  escapeLikePattern,
  normalizeListQuery,
  parseStatuses,
  queryRows,
} from "../list-query";

const row = (overrides: Partial<Parameters<typeof queryRows>[0][number]>) => ({
  role_name: "Engineer",
  company_name: "Acme",
  date_applied: "2026-01-01",
  location: "Tel Aviv",
  platform: "linkedin",
  status: "Applied",
  statusCategory: "applied",
  salary: null,
  description: null,
  createdAt: "2026-01-01T10:00:00Z",
  ...overrides,
});

describe("normalizeListQuery", () => {
  it("falls back to safe defaults for invalid input", () => {
    expect(
      normalizeListQuery({
        status: "bogus",
        sort: "password",
        page: -3,
        size: 1000,
        platform: "all",
      }),
    ).toEqual({
      search: "",
      statuses: null,
      stage: null,
      from: null,
      to: null,
      platform: null,
      sort: null,
      desc: true,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
  });

  it("keeps valid values and normalizes case and whitespace", () => {
    expect(
      normalizeListQuery({
        q: "  react  ",
        status: "Ghosted",
        platform: " LinkedIn ",
        sort: "location",
        dir: "asc",
        page: 4,
        size: 25,
      }),
    ).toEqual({
      search: "react",
      statuses: ["ghosted"],
      stage: null,
      from: null,
      to: null,
      platform: "linkedin",
      sort: "location",
      desc: false,
      page: 4,
      pageSize: 25,
    });
  });

  it("accepts the table page sizes and the Kanban batch size only", () => {
    expect(normalizeListQuery({ size: 100 }).pageSize).toBe(100);
    expect(normalizeListQuery({ size: 20 }).pageSize).toBe(20);
    expect(normalizeListQuery({ size: 5 }).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it("accepts a stage and valid date bounds only", () => {
    expect(normalizeListQuery({ stage: "interviewed", from: "2026-09-01", to: "2026-09-30" })).toMatchObject({
      stage: "interviewed",
      from: "2026-09-01",
      to: "2026-09-30",
    });
    expect(normalizeListQuery({ stage: "hired", from: "2026-02-30", to: "soon" })).toMatchObject({
      stage: null,
      from: null,
      to: null,
    });
    expect(normalizeListQuery({ from: "2026-10-01", to: "2026-09-01" })).toMatchObject({
      from: "2026-09-01",
      to: "2026-10-01",
    });
  });

  it("caps the search length", () => {
    expect(normalizeListQuery({ q: "x".repeat(500) }).search).toHaveLength(200);
  });
});

describe("parseStatuses", () => {
  it("reads single statuses, lists and groups", () => {
    expect(parseStatuses("ghosted")).toEqual(["ghosted"]);
    expect(parseStatuses("rejected, ghosted,bogus")).toEqual(["rejected", "ghosted"]);
    expect(parseStatuses("active")).toEqual(["applied", "review", "interview", "other"]);
    expect(parseStatuses("closed")).toEqual(["accepted", "rejected", "ghosted"]);
    expect(parseStatuses("submitted")).not.toContain("saved");
    expect(parseStatuses("submitted")).toHaveLength(7);
    expect(parseStatuses("")).toBeNull();
    expect(parseStatuses("bogus")).toBeNull();
  });
});

describe("escapeLikePattern", () => {
  it("escapes LIKE wildcards and the escape character", () => {
    expect(escapeLikePattern("100%_a\\b")).toBe("100\\%\\_a\\\\b");
  });
});

describe("queryRows", () => {
  const rows = [
    row({ company_name: "Acme", date_applied: "2026-03-01" }),
    row({
      company_name: "Globex",
      date_applied: "2026-02-01",
      description: "We use React and TypeScript",
      statusCategory: "rejected",
      status: "Rejected",
      platform: "Indeed",
    }),
    row({ company_name: "Initech", date_applied: "2026-01-01" }),
  ];
  const base = normalizeListQuery({});

  it("orders by date applied, newest first, by default", () => {
    expect(queryRows(rows, base).rows.map((r) => r.company_name)).toEqual([
      "Acme",
      "Globex",
      "Initech",
    ]);
  });

  it("matches search text inside job descriptions", () => {
    const result = queryRows(rows, { ...base, search: "typescript" });
    expect(result.total).toBe(1);
    expect(result.rows[0].company_name).toBe("Globex");
  });

  it("matches search text inside notes", () => {
    const withNotes = [...rows, row({ company_name: "Hooli", notes: "Referred by Dana Levi" })];
    const result = queryRows(withNotes, { ...base, search: "dana" });
    expect(result.rows.map((r) => r.company_name)).toEqual(["Hooli"]);
  });

  it("filters by status and platform", () => {
    expect(queryRows(rows, { ...base, statuses: ["rejected"] }).total).toBe(1);
    expect(queryRows(rows, { ...base, statuses: ["rejected", "applied"] }).total).toBe(3);
    expect(queryRows(rows, { ...base, platform: "indeed" }).total).toBe(1);
  });

  it("filters by date applied, inclusive", () => {
    expect(queryRows(rows, { ...base, from: "2026-02-01", to: "2026-03-01" }).total).toBe(2);
    expect(queryRows(rows, { ...base, to: "2026-01-31" }).total).toBe(1);
  });

  it("filters by stage using status history", () => {
    const staged = [
      row({ id: "a", company_name: "Was interviewed", status: "Rejected", statusCategory: "rejected" }),
      row({ id: "b", company_name: "Only reviewed", status: "In Review", statusCategory: "review" }),
      row({ id: "c", company_name: "No reply", status: "Ghosted", statusCategory: "ghosted" }),
    ];
    const history = new Map([
      ["a", [{ status: "Interview", statusCategory: "interview" }]],
      ["c", [{ status: "Applied", statusCategory: "applied" }]],
    ]);
    const names = (stage: "interviewed" | "responded") =>
      queryRows(staged, { ...base, stage }, history).rows.map((r) => r.company_name);
    expect(names("interviewed")).toEqual(["Was interviewed"]);
    expect(names("responded")).toEqual(["Was interviewed", "Only reviewed"]);
  });

  it("sorts by the requested column and pages the result", () => {
    const sorted = { ...base, sort: "role_name" as const, desc: true };
    expect(
      queryRows(rows, { ...sorted, pageSize: 2, page: 1 }).rows.map(
        (r) => r.company_name,
      ),
    ).toEqual(["Initech", "Globex"]);
    const secondPage = queryRows(rows, { ...sorted, pageSize: 2, page: 2 });
    expect(secondPage.rows.map((r) => r.company_name)).toEqual(["Acme"]);
    expect(secondPage.total).toBe(3);
  });
});
