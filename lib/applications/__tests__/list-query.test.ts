import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  escapeLikePattern,
  normalizeListQuery,
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
      status: null,
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
      status: "ghosted",
      platform: "linkedin",
      sort: "location",
      desc: false,
      page: 4,
      pageSize: 25,
    });
  });

  it("caps the search length", () => {
    expect(normalizeListQuery({ q: "x".repeat(500) }).search).toHaveLength(200);
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

  it("filters by status and platform", () => {
    expect(queryRows(rows, { ...base, status: "rejected" }).total).toBe(1);
    expect(queryRows(rows, { ...base, platform: "indeed" }).total).toBe(1);
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
