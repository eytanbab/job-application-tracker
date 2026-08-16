import { ParseResult, ParsedJob } from "./types";
import { parseGreenhouse } from "./greenhouse";
import { parseLever } from "./lever";
import { parseAshby } from "./ashby";
import { parseSmartRecruiters } from "./smartrecruiters";
import { parseWorkday } from "./workday";
import { parseWorkable } from "./workable";
import { parseLinkedIn } from "./linkedin";
import { parseIndeed } from "./indeed";
import { parseJsonLdJob } from "./jsonld";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";

export * from "./types";
export * from "./utils";

function detectPlatform(hostname: string): string {
  const host = hostname.toLowerCase();

  if (host.includes("greenhouse.io")) return "Greenhouse";
  if (host.includes("lever.co")) return "Lever";
  if (host.includes("ashbyhq.com")) return "Ashby";
  if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
  if (host.includes("myworkdayjobs.com") || host.includes("myworkdaysite.com")) return "Workday";
  if (host.includes("workable.com")) return "Workable";
  if (host.includes("linkedin.com")) return "LinkedIn";
  if (host.includes("indeed.com")) return "Indeed";
  if (host.includes("ziprecruiter.com")) return "ZipRecruiter";
  if (host.includes("glassdoor.com")) return "Glassdoor";
  if (host.includes("wellfound.com") || host.includes("angel.co")) return "Wellfound";
  if (host.includes("bamboohr.com")) return "BambooHR";
  if (host.includes("breezy.hr")) return "Breezy HR";
  if (host.includes("rippling.com") || host.includes("rippling-ats.com")) return "Rippling";
  if (host.includes("jobvite.com")) return "Jobvite";
  if (host.includes("recruitee.com")) return "Recruitee";
  if (host.includes("applytojob.com")) return "JazzHR";

  return "Company Website";
}

/**
 * Attempts deterministic extraction without AI across all supported platforms and Schema.org JSON-LD.
 * Returns ParsedJob if successful, or null if AI extraction fallback is needed.
 */
export async function tryDeterministicExtraction(url: string): Promise<ParsedJob | null> {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const platform = detectPlatform(hostname);

    let result: ParseResult = { success: false };

    // 1. Route to platform-specific API / DOM parsers
    if (platform === "Greenhouse") {
      result = await parseGreenhouse(url);
    } else if (platform === "Lever") {
      result = await parseLever(url);
    } else if (platform === "Ashby") {
      result = await parseAshby(url);
    } else if (platform === "SmartRecruiters") {
      result = await parseSmartRecruiters(url);
    } else if (platform === "Workday") {
      result = await parseWorkday(url);
    } else if (platform === "Workable") {
      result = await parseWorkable(url);
    } else if (platform === "LinkedIn") {
      result = await parseLinkedIn(url);
    } else if (platform === "Indeed") {
      result = await parseIndeed(url);
    }

    if (result.success && result.data.role_name && result.data.company_name) {
      return result.data;
    }

    // 2. Generic Fast Fetch + Schema.org JSON-LD parser (ZipRecruiter, BambooHR, Breezy, etc.)
    try {
      const htmlRes = await fetchWithTimeout(url, {}, 3500);
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const jsonLdResult = parseJsonLdJob(html, url, platform);

        if (
          jsonLdResult.success &&
          jsonLdResult.data.role_name &&
          (jsonLdResult.data.company_name || jsonLdResult.data.description)
        ) {
          if (!jsonLdResult.data.company_name) {
            const hostParts = hostname.replace(/^www\./, "").split(".");
            jsonLdResult.data.company_name = formatCompanyName(hostParts[0]);
          }
          return jsonLdResult.data;
        }

        // Fast OpenGraph fallback
        const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
        const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
        const ogSiteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1];

        if (ogTitle && (ogDesc || ogSiteName)) {
          let roleName = ogTitle;
          let companyName = ogSiteName || "";

          if (ogTitle.includes(" hiring ") && !companyName) {
            const parts = ogTitle.split(" hiring ");
            companyName = parts[0].trim();
            roleName = parts[1].replace(/\sin\s.*$/i, "").trim();
          } else if (ogTitle.includes(" at ") && !companyName) {
            const parts = ogTitle.split(" at ");
            roleName = parts[0].trim();
            companyName = parts[1].split(/[|•-]/)[0].trim();
          } else if (ogTitle.includes(" - ")) {
            const parts = ogTitle.split(" - ");
            roleName = parts[0].trim();
            if (parts[1] && !companyName) companyName = parts[1].trim();
          }

          if (roleName && (companyName || ogDesc)) {
            return {
              role_name: roleName.trim(),
              company_name: formatCompanyName(companyName || hostname.split(".")[0]),
              link: url,
              platform,
              status: "Applied",
              description: htmlToPlainText(ogDesc || "").slice(0, 15000),
              location: "Remote",
            };
          }
        }
      }
    } catch {
      // Continue to fallback
    }
  } catch (err) {
    console.warn("[Deterministic Parser] Skipped due to error:", err);
  }

  return null;
}
