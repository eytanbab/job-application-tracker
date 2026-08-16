/**
 * Production-ready high performance scraper.
 * Prioritizes fast direct fetch + JSON-LD / Meta extraction, with timed Jina Reader and Playwright fallbacks.
 */

// Helper to extract JSON-LD JobPosting schema from raw HTML
function extractJsonLdJob(html: string): string | null {
  try {
    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const items = Array.isArray(parsed)
          ? parsed
          : parsed["@graph"] && Array.isArray(parsed["@graph"])
            ? parsed["@graph"]
            : [parsed];

        const jobPosting = items.find(
          (item: Record<string, unknown>) =>
            item &&
            (item["@type"] === "JobPosting" ||
              (Array.isArray(item["@type"]) &&
                item["@type"].includes("JobPosting"))),
        );

        if (jobPosting) {
          const title = jobPosting.title || jobPosting.name || "";
          const company =
            typeof jobPosting.hiringOrganization === "object" &&
            jobPosting.hiringOrganization !== null
              ? (jobPosting.hiringOrganization as Record<string, unknown>).name || ""
              : typeof jobPosting.hiringOrganization === "string"
                ? jobPosting.hiringOrganization
                : "";

          let location = "";
          if (jobPosting.jobLocation) {
            if (typeof jobPosting.jobLocation === "string") {
              location = jobPosting.jobLocation;
            } else if (Array.isArray(jobPosting.jobLocation)) {
              location = jobPosting.jobLocation
                .map((loc: Record<string, unknown>) => {
                  const addr = loc.address as Record<string, unknown> | undefined;
                  return addr
                    ? [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                        .filter(Boolean)
                        .join(", ")
                    : "";
                })
                .filter(Boolean)
                .join(" / ");
            } else if (typeof jobPosting.jobLocation === "object") {
              const addr = (jobPosting.jobLocation as Record<string, unknown>)
                .address as Record<string, unknown> | undefined;
              location = addr
                ? [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                    .filter(Boolean)
                    .join(", ")
                : "";
            }
          }

          let description = (jobPosting.description as string) || "";
          // Strip basic HTML formatting from JSON-LD description
          description = description
            .replace(/<br\s*[\/]?>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<\/li>/gi, "\n")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

          const employmentType = Array.isArray(jobPosting.employmentType)
            ? jobPosting.employmentType.join(", ")
            : jobPosting.employmentType || "";

          return `[Structured JSON-LD JobPosting Found]\nRole: ${title}\nCompany: ${company}\nLocation: ${location}\nEmployment Type: ${employmentType}\n\nDescription:\n${description}`;
        }
      } catch {
        // Ignore single JSON-LD block parse errors
        continue;
      }
    }
  } catch {
    // Ignore JSON-LD regex errors
  }
  return null;
}

// Clean raw HTML to extract meaningful text
function extractHtmlText(html: string): string {
  const metaTitle =
    html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    "";
  const metaDesc =
    html.match(
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] ||
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] ||
    "";
  const siteName =
    html.match(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i,
    )?.[1] || "";

  const cleanText = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `Meta Title: ${metaTitle}\nSite Name: ${siteName}\nMeta Description: ${metaDesc}\n\nPage Text:\n${cleanText.slice(0, 15000)}`;
}

export const scraper = async (url: string): Promise<string> => {
  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    console.log(`[Scraper] Starting extraction for: ${url}`);
  }

  // 1. Fast Direct HTML Fetch First (Instant for Greenhouse, Lever, Ashby, Workday, etc.)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const htmlRes = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeoutId);

    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Check for JSON-LD structured data first (fastest and highest fidelity)
      const jsonLdJob = extractJsonLdJob(html);
      if (jsonLdJob && jsonLdJob.length > 200) {
        if (isDevelopment) {
          console.log("[Scraper] Fast-path: JSON-LD JobPosting extracted.");
        }
        return jsonLdJob;
      }

      // Check for HTML text content
      const extractedText = extractHtmlText(html);
      if (extractedText && extractedText.length > 500) {
        if (isDevelopment) {
          console.log(
            `[Scraper] Fast-path: HTML direct fetch extracted ${extractedText.length} chars.`,
          );
        }
        return extractedText;
      }
    }
  } catch (err) {
    if (isDevelopment) {
      console.log("[Scraper] Direct HTML fetch skipped or timed out:", err);
    }
  }

  // 2. Jina Reader fallback (with strict 5s timeout)
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain",
        "X-No-Cache": "true",
        "X-Return-Format": "markdown",
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();
      if (text && text.length > 200) {
        if (isDevelopment) {
          console.log(
            `[Scraper] Jina responded successfully. Length: ${text.length}`,
          );
        }
        return text.slice(0, 15000);
      }
    }
  } catch (error) {
    if (isDevelopment) {
      console.warn("[Scraper] Jina Reader skipped or timed out:", error);
    }
  }

  // 3. Standalone Microservice fallback (If configured)
  if (process.env.SCRAPER_SERVICE_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(
        `${process.env.SCRAPER_SERVICE_URL}/scrape?url=${encodeURIComponent(url)}`,
        { signal: controller.signal },
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.text) return data.text.slice(0, 15000);
      }
    } catch (err) {
      console.error("[Scraper] Custom Scraper Service failed:", err);
    }
  }

  // 4. Local Playwright Fallback (Development only, optimized for speed)
  if (isDevelopment) {
    try {
      const { chromium } = await import("playwright-extra");
      const stealth = (await import("puppeteer-extra-plugin-stealth")).default;
      chromium.use(stealth());

      const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
      });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Fast domcontentloaded navigation with 6s timeout instead of networkidle
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 6000,
      });

      const content = await page.evaluate(() => document.body.innerText);
      await browser.close();

      if (content && content.length > 100) {
        return content.slice(0, 15000);
      }
    } catch (err) {
      console.warn("[Scraper] Local Playwright fallback failed:", err);
    }
  }

  return "";
};
