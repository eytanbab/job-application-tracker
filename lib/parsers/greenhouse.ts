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

      // Check DOM and meta selectors in HTML (supports both modern job-boards.greenhouse.io and legacy embeds)
      const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      let titleRole = "";
      let titleCompany = "";
      if (titleTagMatch?.[1]) {
        const t = titleTagMatch[1].trim();
        const ghMatch = t.match(/Job Application for (.+?) at (.+)/i);
        if (ghMatch) {
          titleRole = ghMatch[1].trim();
          titleCompany = ghMatch[2].trim();
        }
      }

      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim();
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim();

      const h1Match = html.match(/<h1[^>]*class=["'][^"']*(?:section-header|app-title)[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

      const logoMatch = html.match(/<img[^>]*alt=["']([^"']+)\s+Logo["']/i);
      const companySpan = html.match(/<span[^>]*class=["'][^"']*company-name[^"']*["'][^>]*>(?:at\s+)?([^<]+)<\/span>/i);

      const modernLocMatch = html.match(/class=["'][^"']*job__location[^"']*["'][^>]*>[\s\S]*?<div>([^<]+)<\/div>/i);
      const legacyLocMatch = html.match(/<div[^>]*class=["'][^"']*location[^"']*["'][^>]*>([^<]+)<\/div>/i);

      const roleName = titleRole || ogTitle || h1Match?.[1]?.trim() || "";
      const companyName = titleCompany || logoMatch?.[1]?.trim() || companySpan?.[1]?.trim() || (boardToken ? formatCompanyName(boardToken) : "Company");
      const location = modernLocMatch?.[1]?.trim() || legacyLocMatch?.[1]?.trim() || (ogDesc && ogDesc.length < 80 ? ogDesc : "Remote");

      const modernDescMatch = html.match(/class=["'][^"']*job__description[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class=["'][^"']*job__application/i) ||
                              html.match(/class=["'][^"']*job__description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const legacyDescMatch = html.match(/<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id=["']app_form/i);

      const rawDesc = modernDescMatch?.[1] || legacyDescMatch?.[1] || html;

      if (roleName) {
        return {
          success: true,
          source: "dom",
          data: {
            role_name: roleName,
            company_name: companyName,
            link: url,
            platform: "Greenhouse",
            status: "Applied",
            description: htmlToPlainText(rawDesc).slice(0, 15000),
            location,
          },
        };
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Greenhouse posting" };
}
