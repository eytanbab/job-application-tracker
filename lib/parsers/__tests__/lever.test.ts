import { describe, expect, it } from "vitest";
import { parseLever } from "../lever";
import { htmlResponse, jsonResponse, mockFetch, notFound } from "@/test/fetch-mock";
import { readFixture, readJsonFixture } from "./fixtures";

const JOB_ID = "6b1f2c4e-1111-4a2b-9c3d-0123456789ab";
const JOB_URL = `https://jobs.lever.co/acme-corp/${JOB_ID}`;
const API_URL = `https://api.lever.co/v0/postings/acme-corp/${JOB_ID}`;

describe("parseLever", () => {
  it("reads the public postings API", async () => {
    mockFetch({ [API_URL]: () => jsonResponse(readJsonFixture("lever-api.json")) });

    const result = await parseLever(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("api");
    expect(result.data).toMatchObject({
      role_name: "Backend Engineer",
      company_name: "Acme Corp",
      platform: "Lever",
      location: "Berlin, Germany",
    });
    expect(result.data.description).toBe(
      "We are looking for a backend engineer.\n\nAdditional Information:\nVisa sponsorship available.",
    );
  });

  it("joins allLocations when there is no primary location", async () => {
    const posting = readJsonFixture("lever-api.json") as { categories: object };
    mockFetch({
      [API_URL]: () =>
        jsonResponse({
          ...posting,
          categories: { allLocations: ["Paris", "Lyon"] },
        }),
    });

    const result = await parseLever(JOB_URL);

    expect(result.success && result.data.location).toBe("Paris, Lyon");
  });

  it("leaves an unknown location empty instead of guessing Remote", async () => {
    const posting = readJsonFixture("lever-api.json") as object;
    mockFetch({ [API_URL]: () => jsonResponse({ ...posting, categories: {} }) });

    const result = await parseLever(JOB_URL);

    expect(result.success && result.data.location).toBe("");
  });

  it("falls back to the posting page, still without inventing a location", async () => {
    mockFetch({
      [API_URL]: notFound,
      [JOB_URL]: () => htmlResponse(readFixture("lever-posting.html")),
    });

    const result = await parseLever(JOB_URL);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("dom");
    expect(result.data.role_name).toBe("Frontend Engineer");
    expect(result.data.company_name).toBe("Acme Corp");
    expect(result.data.location).toBe("");
  });
});
