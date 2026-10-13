import { describe, expect, it } from "vitest";
import { parseJsonLdJob } from "../jsonld";
import { readFixture } from "./fixtures";

const URL = "https://careers.example.com/jobs/sre";

function pageWith(jobPosting: Record<string, unknown>): string {
  return `<html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    ...jobPosting,
  })}</script></head><body></body></html>`;
}

describe("parseJsonLdJob", () => {
  it("reads a JobPosting from an @graph", () => {
    const result = parseJsonLdJob(readFixture("jsonld-posting.html"), URL, "Company Website");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("json-ld");
    expect(result.data).toMatchObject({
      role_name: "Site Reliability Engineer",
      company_name: "Example Co",
      platform: "Company Website",
      location: "Austin, TX, US",
      description: "Keep production healthy.",
      salary: "USD150000 - USD190000/YEAR",
    });
  });

  it("joins multiple job locations", () => {
    const result = parseJsonLdJob(
      pageWith({
        title: "Engineer",
        hiringOrganization: { name: "Example Co" },
        jobLocation: [
          { address: { addressLocality: "Tel Aviv", addressCountry: "IL" } },
          { address: { addressLocality: "New York", addressRegion: "NY" } },
        ],
      }),
      URL,
    );

    expect(result.success && result.data.location).toBe("Tel Aviv, IL / New York, NY");
  });

  it("maps an explicit TELECOMMUTE posting to Remote", () => {
    const result = parseJsonLdJob(
      pageWith({
        title: "Engineer",
        hiringOrganization: { name: "Example Co" },
        jobLocationType: "TELECOMMUTE",
      }),
      URL,
    );

    expect(result.success && result.data.location).toBe("Remote");
  });

  it("leaves an unknown location empty instead of guessing Remote", () => {
    const result = parseJsonLdJob(
      pageWith({ title: "Engineer", hiringOrganization: "Example Co", description: "Hi" }),
      URL,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.location).toBe("");
    expect(result.data.platform).toBe("Direct Apply");
  });

  it("skips malformed JSON-LD blocks and keeps looking", () => {
    const html =
      '<script type="application/ld+json">{ not json</script>' +
      pageWith({ title: "Engineer", hiringOrganization: { name: "Example Co" } });

    const result = parseJsonLdJob(html, URL);

    expect(result.success && result.data.role_name).toBe("Engineer");
  });

  it("reports failure when there is no JobPosting", () => {
    const html = '<script type="application/ld+json">{"@type":"Organization","name":"X"}</script>';

    expect(parseJsonLdJob(html, URL).success).toBe(false);
  });
});
