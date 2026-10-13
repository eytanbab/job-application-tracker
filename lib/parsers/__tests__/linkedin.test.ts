import { describe, expect, it } from "vitest";
import { parseLinkedIn } from "../linkedin";
import { htmlResponse, mockFetch } from "@/test/fetch-mock";
import { readFixture } from "./fixtures";

const JOB_URL = "https://www.linkedin.com/jobs/view/4100000001";

describe("parseLinkedIn", () => {
  it("parses the guest job page markup", async () => {
    const result = await parseLinkedIn(JOB_URL, readFixture("linkedin-guest.html"));

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.source).toBe("dom");
    expect(result.data).toMatchObject({
      role_name: "Staff Engineer",
      company_name: "Stripe",
      platform: "LinkedIn",
      location: "Dublin, County Dublin, Ireland",
    });
    expect(result.data.description).toContain("economic infrastructure");
  });

  it("leaves an unknown location empty instead of guessing Remote", async () => {
    const html = readFixture("linkedin-guest.html").replace(
      /<span class="topcard__flavor topcard__flavor--bullet">[^<]*<\/span>/,
      "",
    );

    const result = await parseLinkedIn(JOB_URL, html);

    expect(result.success && result.data.location).toBe("");
  });

  it("fetches the page when no HTML is passed in", async () => {
    mockFetch({ [JOB_URL]: () => htmlResponse(readFixture("linkedin-guest.html")) });

    const result = await parseLinkedIn(JOB_URL);

    expect(result.success && result.data.role_name).toBe("Staff Engineer");
  });

  it("reports failure for a page without a job", async () => {
    const result = await parseLinkedIn(JOB_URL, "<html><body>Sign in</body></html>");

    expect(result.success).toBe(false);
  });
});
