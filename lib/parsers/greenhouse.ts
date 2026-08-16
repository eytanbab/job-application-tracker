import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseGreenhouse(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    
    // Pattern 1: /boards/{board_token}/jobs/{job_id} or /{board_token}/jobs/{job_id}
    let match = pathname.match(/(?:\/boards)?\/([^/]+)\/jobs\/(\d+)/i);
    let boardToken = match?.[1];
    let jobId = match?.[2];

    // Pattern 2: ?gh_jid=12345 or ?token=12345
    if (!jobId) {
      jobId = parsedUrl.searchParams.get("gh_jid") || parsedUrl.searchParams.get("token") || undefined;
      boardToken = parsedUrl.searchParams.get("for") || pathname.split("/").filter(Boolean)[0];
    }

    // 1. Try Direct Greenhouse Public API first (~80ms)
    if (boardToken && jobId) {
      try {
        const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs/${encodeURIComponent(jobId)}`;
        const apiRes = await fetchWithTimeout(apiUrl, {}, 3000);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.title) {
            const roleName = data.title;
            const location = data.location?.name || "Remote";
            const description = htmlToPlainText(data.content || "");
            const companyName = formatCompanyName(boardToken);

            return {
              success: true,
              source: "api",
              data: {
                role_name: roleName,
                company_name: companyName,
                link: url,
                platform: "Greenhouse",
                status: "Applied",
                description: description.slice(0, 15000),
                location,
              },
            };
          }
        }
      } catch {
        // Fallback to HTML scraping
      }
    }

    // 2. Direct HTML fetch fallback
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Check JSON-LD
      const jsonLdResult = parseJsonLdJob(html, url, "Greenhouse");
      if (jsonLdResult.success) {
        if (!jsonLdResult.data.company_name && boardToken) {
          jsonLdResult.data.company_name = formatCompanyName(boardToken);
        }
        return jsonLdResult;
      }

      // Check DOM selectors in HTML
      const titleMatch = html.match(/<h1[^>]*class=["'][^"']*app-title[^"']*["'][^>]*>([^<]+)<\/h1>/i) ||
                         html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      const companyMatch = html.match(/<span[^>]*class=["'][^"']*company-name[^"']*["'][^>]*>(?:at\s+)?([^<]+)<\/span>/i);
      const locationMatch = html.match(/<div[^>]*class=["'][^"']*location[^"']*["'][^>]*>([^<]+)<\/div>/i);
      const contentMatch = html.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id=["']app_form/i);

      if (titleMatch?.[1]) {
        return {
          success: true,
          source: "dom",
          data: {
            role_name: titleMatch[1].trim(),
            company_name: companyMatch?.[1]?.trim() || (boardToken ? formatCompanyName(boardToken) : "Company"),
            link: url,
            platform: "Greenhouse",
            status: "Applied",
            description: htmlToPlainText(contentMatch?.[1] || html).slice(0, 15000),
            location: locationMatch?.[1]?.trim() || "Remote",
          },
        };
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Greenhouse posting" };
}
