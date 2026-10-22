import { describe, expect, it, vi } from "vitest";
import { mockFetch } from "@/test/fetch-mock";
import { scraper } from "../scraper";

describe("scraper", () => {
  it("does not hand a link that redirects to a private address to the fallbacks", async () => {
    vi.stubEnv("SCRAPER_SERVICE_URL", "https://scraper.internal.example");
    const fetchMock = mockFetch({
      "https://attacker.example.com/r": () =>
        new Response(null, { status: 302, headers: { Location: "http://169.254.169.254/latest/meta-data/" } }),
    });

    expect(await scraper("https://attacker.example.com/r")).toBe("");
    // Only the first hop was requested: no Jina or scraper-service call
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
