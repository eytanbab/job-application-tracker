import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseWorkable(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    // Pattern: /account/shortlink or /j/shortlink
    const parts = pathname.split("/").filter(Boolean);
    const accountSlug = parts[0];
    const shortlink = parts[1];

    // 1. Direct Workable Public Widget API (~90ms)
    if (accountSlug && shortlink && accountSlug !== "j") {
      try {
        const apiUrl = `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(accountSlug)}/jobs/${encodeURIComponent(shortlink)}`;
        const apiRes = await fetchWithTimeout(apiUrl, {}, 3000);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.title) {
            const roleName = data.title;
            const companyName = data.company?.name || formatCompanyName(accountSlug);
            const location =
              [data.city, data.region, data.country].filter(Boolean).join(", ") ||
              (data.telecommuting ? "Remote" : "Remote");
            const description = htmlToPlainText(data.description || data.requirements || "");

            return {
              success: true,
              source: "api",
              data: {
                role_name: roleName,
                company_name: companyName,
                link: url,
                platform: "Workable",
                status: "Applied",
                description: description.slice(0, 15000),
                location,
              },
            };
          }
        }
      } catch {
        // Fallback
      }
    }

    // 2. Direct HTML fetch fallback
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      return parseJsonLdJob(html, url, "Workable");
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Workable posting" };
}
