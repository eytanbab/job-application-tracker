import { beforeEach, describe, expect, it } from "vitest";
import { format, subDays } from "date-fns";
import { mockStore } from "@/lib/mock-data/mock-store";
import { collectApplications } from "../account-data";
import { GET } from "@/app/api/analytics/export/route";

const USER = "mock-dev-user";
const iso = (d: Date) => format(d, "yyyy-MM-dd");

// Without DATABASE_URL these run against the mock store, as the guest demo does.
describe("analytics CSV export (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("collects only applications inside the range, oldest first", async () => {
    const all = mockStore.getApplications(USER);
    const dates = all.map((a) => a.date_applied).sort();
    const range = { from: dates[1], to: dates[dates.length - 2] };

    const rows = await collectApplications(USER, range);
    const expected = all.filter((a) => a.date_applied >= range.from && a.date_applied <= range.to);
    expect(rows).toHaveLength(expected.length);
    expect(rows.every((a) => a.date_applied >= range.from && a.date_applied <= range.to)).toBe(true);
    expect(rows.map((a) => a.date_applied)).toEqual([...rows.map((a) => a.date_applied)].sort());
    expect(await collectApplications(USER, { from: null, to: null })).toHaveLength(all.length);
  });

  it("downloads the selected period as CSV with a dated file name", async () => {
    const from = iso(subDays(new Date(), 29));
    const res = await GET(new Request("http://localhost/api/analytics/export?range=30d"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toBe(
      `attachment; filename="job-applications-${from}-to-${iso(new Date())}.csv"`,
    );

    const lines = (await res.text()).trim().split("\r\n");
    const inRange = mockStore.getApplications(USER).filter((a) => a.date_applied >= from);
    expect(lines[0]).toMatch(/^id,role,company,/);
    expect(lines).toHaveLength(inRange.length + 1);
  });

  it("names all-time exports and escapes formula cells", async () => {
    const [template] = mockStore.getApplications(USER);
    mockStore.createApplication(USER, {
      ...template,
      role_name: "=HYPERLINK(\"http://evil\")",
      date_applied: "2001-01-01",
    });

    const res = await GET(new Request("http://localhost/api/analytics/export?range=all"));
    expect(res.headers.get("Content-Disposition")).toContain(`job-applications-all-${iso(new Date())}.csv`);
    const firstRow = (await res.text()).split("\r\n")[1];
    expect(firstRow).toContain(`"'=HYPERLINK(""http://evil"")"`);
  });
});
