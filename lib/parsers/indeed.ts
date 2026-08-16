import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseIndeed(url: string, rawHtml?: string): Promise<ParseResult> {
  try {
    let html = rawHtml;

    if (!html) {
      const htmlRes = await fetchWithTimeout(url, {}, 3500);
      if (htmlRes.ok) {
        html = await htmlRes.text();
      }
    }

    if (html) {
      // 1. Check Schema.org JSON-LD (as shown in indeed.html sample)
      const jsonLdResult = parseJsonLdJob(html, url, "Indeed");
      if (jsonLdResult.success && jsonLdResult.data.role_name) {
        return jsonLdResult;
      }

      // 2. DOM Parsing for Indeed
      let role = "";
      const titleMatch = html.match(/<h1[^>]*class=["'][^"']*jobsearch-JobInfoHeader-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                         html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      if (titleMatch?.[1]) {
        role = titleMatch[1].replace(/<[^>]+>/g, "").split(" - ")[0].trim();
      }

      let company = "";
      const companyMatch = html.match(/<div[^>]*data-testid=["']inlineHeader-companyName["'][^>]*>([\s\S]*?)<\/div>/i) ||
                           html.match(/<div[^>]*class=["'][^"']*jobsearch-InlineCompanyRating-companyHeader[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      if (companyMatch?.[1]) {
        company = companyMatch[1].replace(/<[^>]+>/g, "").trim();
      }

      let location = "";
      const locationMatch = html.match(/<div[^>]*data-testid=["']inlineHeader-companyLocation["'][^>]*>([\s\S]*?)<\/div>/i);
      if (locationMatch?.[1]) {
        location = locationMatch[1].replace(/<[^>]+>/g, "").trim();
      }

      let description = "";
      const descMatch = html.match(/<div[^>]*id=["']jobDescriptionText["'][^>]*>([\s\S]*?)<\/div>/i);
      description = htmlToPlainText(descMatch?.[1] || "");

      if (role && (company || description)) {
        return {
          success: true,
          source: "dom",
          data: {
            role_name: role,
            company_name: formatCompanyName(company || "Company"),
            link: url,
            platform: "Indeed",
            status: "Applied",
            description: description.slice(0, 15000),
            location: location || "Remote",
          },
        };
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Indeed posting" };
}
