import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseLever(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    // Pattern: /:company/:jobId
    const parts = pathname.split("/").filter(Boolean);
    const companySlug = parts[0];
    const jobId = parts[1];

    // 1. Try Direct Lever Public API first (~80ms)
    if (companySlug && jobId && jobId !== "apply") {
      try {
        const apiUrl = `https://api.lever.co/v0/postings/${encodeURIComponent(companySlug)}/${encodeURIComponent(jobId)}`;
        const apiRes = await fetchWithTimeout(apiUrl, {}, 3000);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.text) {
            const roleName = data.text;
            const location =
              data.categories?.location ||
              (Array.isArray(data.categories?.allLocations)
                ? data.categories.allLocations.join(", ")
                : "") ||
              "Remote";
            
            let description = data.descriptionPlain || "";
            if (!description && data.description) {
              description = htmlToPlainText(data.description);
            }
            if (data.additionalPlain) {
              description += `\n\nAdditional Information:\n${data.additionalPlain}`;
            }

            return {
              success: true,
              source: "api",
              data: {
                role_name: roleName,
                company_name: formatCompanyName(companySlug),
                link: url,
                platform: "Lever",
                status: "Applied",
                description: description.slice(0, 15000),
                location,
              },
            };
          }
        }
      } catch {
        // Fallback to HTML
      }
    }

    // 2. Direct HTML fetch fallback
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (htmlRes.ok) {
      const html = await htmlRes.text();

      const jsonLdResult = parseJsonLdJob(html, url, "Lever");
      if (jsonLdResult.success) {
        if (!jsonLdResult.data.company_name && companySlug) {
          jsonLdResult.data.company_name = formatCompanyName(companySlug);
        }
        return jsonLdResult;
      }

      const titleMatch = html.match(/<div[^>]*class=["'][^"']*posting-headline[^"']*["'][^>]*>\s*<h2[^>]*>([^<]+)<\/h2>/i) ||
                         html.match(/<h2[^>]*>([^<]+)<\/h2>/i);
      const locationMatch = html.match(/<div[^>]*class=["'][^"']*location[^"']*["'][^>]*>([^<]+)<\/div>/i);
      const descMatch = html.match(/<div[^>]*data-qa=["']job-description["'][^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class=["']section-page-wrapper/i) ||
                        html.match(/<div[^>]*class=["'][^"']*section-wrapper[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      if (titleMatch?.[1]) {
        return {
          success: true,
          source: "dom",
          data: {
            role_name: titleMatch[1].trim(),
            company_name: formatCompanyName(companySlug || "Company"),
            link: url,
            platform: "Lever",
            status: "Applied",
            description: htmlToPlainText(descMatch?.[1] || html).slice(0, 15000),
            location: locationMatch?.[1]?.trim() || "Remote",
          },
        };
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Lever posting" };
}
