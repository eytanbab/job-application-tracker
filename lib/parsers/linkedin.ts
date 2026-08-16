import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseLinkedIn(url: string, rawHtml?: string): Promise<ParseResult> {
  try {
    let html = rawHtml;

    if (!html) {
      const htmlRes = await fetchWithTimeout(url, {}, 3500);
      if (htmlRes.ok) {
        html = await htmlRes.text();
      }
    }

    if (html) {
      // 1. Check Schema.org JSON-LD (e.g. guest page / SSR)
      const jsonLdResult = parseJsonLdJob(html, url, "LinkedIn");
      if (jsonLdResult.success && jsonLdResult.data.role_name && jsonLdResult.data.company_name) {
        return jsonLdResult;
      }

      // 2. DOM / SDUI Parsing for LinkedIn HTML structure
      // Company name
      let company = "";
      const companyAriaMatch = html.match(/aria-label=["']Company,\s*([^"'.]+)/i);
      const companyOrgLinkMatch = html.match(/<a[^>]*class=["'][^"']*topcard__org-name-link[^"']*["'][^>]*>([^<]+)<\/a>/i);
      const companyHrefMatch = html.match(/href=["']https?:\/\/[^"']*linkedin\.com\/company\/[^"']+["'][^>]*>([^<]+)<\/a>/i);
      company = companyAriaMatch?.[1] || companyOrgLinkMatch?.[1] || companyHrefMatch?.[1] || "";

      // Role name
      let role = "";
      const alertJobMatch = html.match(/aria-label=["']Set alert for similar jobs as ([^"']+)["']/i);
      const topcardTitleMatch = html.match(/<h1[^>]*class=["'][^"']*top-card-layout__title[^"']*["'][^>]*>([^<]+)<\/h1>/i);
      const titlePtagMatch = html.match(
        /<p[^>]*class=["'][^"']*(?:d836b1ef|_18f99264)[^"']*["'][^>]*>\s*([^<\n]+?)(?:<span|<\/p|<a)/i,
      );
      role = alertJobMatch?.[1]?.split(",")?.[0]?.trim() ||
             topcardTitleMatch?.[1]?.trim() ||
             titlePtagMatch?.[1]?.trim() ||
             "";

      // Location
      let location = "";
      const escapedRole = role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const locationFullMatch = html.match(
        new RegExp(`${escapedRole},\\s*([A-Za-z\\u0590-\\u05fe\\s,.-]+?)(?:<\\/p|<div|<span|aria-|class=)`, "i"),
      );
      const locationWithCommasMatch = html.match(
        /<p[^>]*>\s*<span[^>]*>([A-Za-z\u0590-\u05fe\s]+,\s*[A-Za-z\u0590-\u05fe\s]+,\s*[A-Za-z\u0590-\u05fe\s]+)<\/span>/i,
      );
      const locTopcardMatch = html.match(/<span[^>]*class=["'][^"']*topcard__flavor--bullet[^"']*["'][^>]*>([^<]+)<\/span>/i);

      location =
        locationFullMatch?.[1]?.replace(/[\r\n\s]+/g, " ").trim() ||
        locationWithCommasMatch?.[1]?.replace(/[\r\n\s]+/g, " ").trim() ||
        locTopcardMatch?.[1]?.replace(/[\r\n\s]+/g, " ").trim() ||
        "Remote";

      // Description
      let description = "";
      const expandableDescMatch = html.match(/data-testid=["']expandable-text-box["'][^>]*>([\s\S]*?)<\/span>/i) ||
                                  html.match(/id=["']JobDetails_AboutTheJob[^"']*["'][\s\S]*?<div[^>]*data-sdui-component=["'][^"']*aboutTheJob[^"']*["']>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<div[^>]*id=["']JobDetails_/i) ||
                                  html.match(/<div[^>]*class=["'][^"']*show-more-less-html__markup[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      description = htmlToPlainText(expandableDescMatch?.[1] || "");

      if (role && (company || description)) {
        return {
          success: true,
          source: "dom",
          data: {
            role_name: role.trim(),
            company_name: formatCompanyName(company.trim() || "LinkedIn Company"),
            link: url,
            platform: "LinkedIn",
            status: "Applied",
            description: description.slice(0, 15000),
            location: location.trim(),
          },
        };
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse LinkedIn posting" };
}
