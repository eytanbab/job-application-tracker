import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseWorkday(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    const tenant = hostname.split(".")[0];

    // 1. Direct HTML fetch with JSON-LD
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const jsonLdResult = parseJsonLdJob(html, url, "Workday");
      if (jsonLdResult.success) {
        if (!jsonLdResult.data.company_name) {
          jsonLdResult.data.company_name = formatCompanyName(tenant);
        }
        return jsonLdResult;
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Workday posting" };
}
