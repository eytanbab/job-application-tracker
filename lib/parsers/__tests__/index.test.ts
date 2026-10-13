import { describe, expect, it } from "vitest";
import { formatCompanyName, htmlToPlainText, tryDeterministicExtraction } from "..";
import { htmlResponse, jsonResponse, mockFetch, notFound } from "@/test/fetch-mock";
import { readFixture, readJsonFixture } from "./fixtures";

describe("tryDeterministicExtraction", () => {
  it("routes known boards to their parser", async () => {
    mockFetch({
      "https://boards-api.greenhouse.io/v1/boards/posthog/jobs/4012345": () =>
        jsonResponse(readJsonFixture("greenhouse-api.json")),
    });

    const job = await tryDeterministicExtraction("https://boards.greenhouse.io/posthog/jobs/4012345");

    expect(job).toMatchObject({ role_name: "Senior Product Engineer", platform: "Greenhouse" });
  });

  it("uses generic JSON-LD for unknown sites", async () => {
    const url = "https://careers.example.com/jobs/sre";
    mockFetch({ [url]: () => htmlResponse(readFixture("jsonld-posting.html")) });

    const job = await tryDeterministicExtraction(url);

    expect(job).toMatchObject({
      role_name: "Site Reliability Engineer",
      company_name: "Example Co",
      platform: "Company Website",
      location: "Austin, TX, US",
    });
  });

  it("labels recognized boards without a dedicated parser", async () => {
    const url = "https://www.ziprecruiter.com/c/Example/Job/SRE";
    mockFetch({ [url]: () => htmlResponse(readFixture("jsonld-posting.html")) });

    const job = await tryDeterministicExtraction(url);

    expect(job?.platform).toBe("ZipRecruiter");
  });

  it("falls back to page metadata and leaves the location empty", async () => {
    const url = "https://northwind.example/careers/platform-engineer";
    mockFetch({ [url]: () => htmlResponse(readFixture("meta-only.html")) });

    const job = await tryDeterministicExtraction(url);

    expect(job).toEqual({
      role_name: "Platform Engineer",
      company_name: "Northwind Traders",
      link: url,
      platform: "Company Website",
      status: "Applied",
      description: "Join the team that keeps our platform running.",
      location: "",
    });
  });

  it("returns null when nothing can be parsed, so the AI fallback runs", async () => {
    const url = "https://example.org/opening";
    mockFetch({ [url]: () => htmlResponse("<html><head><title>Hi</title></head></html>") });

    expect(await tryDeterministicExtraction(url)).toBeNull();
  });

  it("returns null when the page cannot be fetched", async () => {
    const url = "https://example.org/missing";
    mockFetch({ [url]: notFound });

    expect(await tryDeterministicExtraction(url)).toBeNull();
  });
});

describe("parser utils", () => {
  it("turns HTML into readable plain text", () => {
    const text = htmlToPlainText(
      "<h2>Role</h2><p>Fast &amp; fun</p><ul><li>One</li><li>Two</li></ul>",
    );
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

    expect(lines).toEqual(["Role", "Fast & fun", "• One", "• Two"]);
    expect(text).not.toMatch(/<|&amp;/);
  });

  it("title-cases company slugs but keeps existing casing", () => {
    expect(formatCompanyName("acme-corp")).toBe("Acme Corp");
    expect(formatCompanyName("PostHog")).toBe("PostHog");
    expect(formatCompanyName("")).toBe("");
  });
});
