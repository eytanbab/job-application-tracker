import { describe, expect, it } from "vitest";
import { parseAshby } from "../ashby";
import { htmlResponse, jsonResponse, mockFetch, notFound } from "@/test/fetch-mock";
import { readFixture } from "./fixtures";

const JOB_URL = "https://jobs.ashbyhq.com/linear/2f6a9a3e-0000-4000-8000-000000000001";
const API_URL = "https://api.ashbyhq.com/posting-api/job-posting-info";

function withJobPosting(jobPosting: Record<string, unknown>): string {
  return readFixture("ashby-next-data.html").replace(
    /"jobPosting": \{[^{}]*\}/,
    `"jobPosting": ${JSON.stringify(jobPosting)}`,
  );
}

describe("parseAshby", () => {
  it("reads the embedded __NEXT_DATA__ posting", async () => {
    mockFetch({ [JOB_URL]: () => htmlResponse(readFixture("ashby-next-data.html")) });

    const result = await parseAshby(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toMatchObject({
      role_name: "Software Engineer",
      company_name: "Linear",
      platform: "Ashby",
      location: "San Francisco, CA",
      description: "Craft the tools teams use.",
    });
  });

  it("maps an explicit remote flag to Remote", async () => {
    mockFetch({
      [JOB_URL]: () => htmlResponse(withJobPosting({ title: "Software Engineer", isRemote: true })),
    });

    const result = await parseAshby(JOB_URL);

    expect(result.success && result.data.location).toBe("Remote");
  });

  it("leaves an unknown location empty instead of guessing Remote", async () => {
    mockFetch({
      [JOB_URL]: () => htmlResponse(withJobPosting({ title: "Software Engineer", isRemote: false })),
    });

    const result = await parseAshby(JOB_URL);

    expect(result.success && result.data.location).toBe("");
  });

  it("parses the rendered page when there is no embedded data", async () => {
    mockFetch({ [JOB_URL]: () => htmlResponse(readFixture("ashby-dom.html")) });

    const result = await parseAshby(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("dom");
    expect(result.data.role_name).toBe("Product Designer");
    expect(result.data.company_name).toBe("Ramp");
    expect(result.data.location).toBe("");
  });

  it("falls back to the posting API, without inventing a location", async () => {
    mockFetch({
      [JOB_URL]: notFound,
      [API_URL]: () => jsonResponse({ title: "Support Engineer", descriptionHtml: "<p>Help customers.</p>" }),
    });

    const result = await parseAshby(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.role_name).toBe("Support Engineer");
    expect(result.data.company_name).toBe("Linear");
    expect(result.data.location).toBe("");
  });
});
