import { describe, expect, it } from "vitest";
import { parseGreenhouse } from "../greenhouse";
import { htmlResponse, jsonResponse, mockFetch, notFound } from "@/test/fetch-mock";
import { readFixture, readJsonFixture } from "./fixtures";

const JOB_URL = "https://boards.greenhouse.io/posthog/jobs/4012345";
const API_URL = "https://boards-api.greenhouse.io/v1/boards/posthog/jobs/4012345";

describe("parseGreenhouse", () => {
  it("reads the public board API", async () => {
    mockFetch({ [API_URL]: () => jsonResponse(readJsonFixture("greenhouse-api.json")) });

    const result = await parseGreenhouse(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("api");
    expect(result.data).toMatchObject({
      role_name: "Senior Product Engineer",
      company_name: "Posthog",
      platform: "Greenhouse",
      status: "Applied",
      location: "London, United Kingdom",
      link: JOB_URL,
    });
    expect(result.data.description).toContain("Build the product & ship fast.");
    expect(result.data.description).toContain("• TypeScript");
    expect(result.data.description).not.toMatch(/<[a-z]/i);
  });

  it("leaves an unknown location empty instead of guessing Remote", async () => {
    const posting = { ...(readJsonFixture("greenhouse-api.json") as object), location: null };
    mockFetch({ [API_URL]: () => jsonResponse(posting) });

    const result = await parseGreenhouse(JOB_URL);

    expect(result.success && result.data.location).toBe("");
  });

  it("falls back to the job page when the API has no posting", async () => {
    const url = "https://job-boards.greenhouse.io/acme/jobs/777";
    mockFetch({
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs/777": notFound,
      [url]: () => htmlResponse(readFixture("greenhouse-board.html")),
    });

    const result = await parseGreenhouse(url);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("dom");
    expect(result.data.role_name).toBe("Data Engineer");
    expect(result.data.company_name).toBe("Acme Analytics");
    expect(result.data.description).toContain("Own our data pipelines.");
    expect(result.data.location).toBe("");
  });

  it("reports failure when neither the API nor the page respond", async () => {
    mockFetch({ [API_URL]: notFound, [JOB_URL]: notFound });

    const result = await parseGreenhouse(JOB_URL);

    expect(result.success).toBe(false);
  });
});
