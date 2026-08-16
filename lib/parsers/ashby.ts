import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseAshby(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    const parts = pathname.split("/").filter(Boolean);
    const companySlug = parts[0];
    const jobId = parts[1];

    // 1. Direct HTML Fetch with __NEXT_DATA__ & JSON-LD (~100ms)
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Check __NEXT_DATA__ (contains exact Ashby state with 100% fidelity)
      const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
      if (nextDataMatch?.[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const jobPosting =
            nextData.props?.pageProps?.jobPosting ||
            nextData.props?.pageProps?.initialJobPosting ||
            nextData.props?.pageProps?.job;

          const orgName =
            nextData.props?.pageProps?.organization?.name ||
            nextData.props?.pageProps?.companyName ||
            formatCompanyName(companySlug || "");

          if (jobPosting && jobPosting.title) {
            const roleName = jobPosting.title;
            const location =
              jobPosting.locationName ||
              (jobPosting.isRemote ? "Remote" : "") ||
              "Remote";
            const rawDesc = jobPosting.descriptionHtml || jobPosting.descriptionPlain || "";
            const description = htmlToPlainText(rawDesc);

            return {
              success: true,
              source: "api",
              data: {
                role_name: roleName,
                company_name: orgName,
                link: url,
                platform: "Ashby",
                status: "Applied",
                description: description.slice(0, 15000),
                location,
              },
            };
          }
        } catch {
          // Fall through to JSON-LD
        }
      }

      // Check JSON-LD
      const jsonLdResult = parseJsonLdJob(html, url, "Ashby");
      if (jsonLdResult.success) {
        if (!jsonLdResult.data.company_name && companySlug) {
          jsonLdResult.data.company_name = formatCompanyName(companySlug);
        }
        return jsonLdResult;
      }
    }

    // 2. Direct Ashby Public Posting API fallback
    if (companySlug && jobId) {
      try {
        const apiUrl = "https://api.ashbyhq.com/posting-api/job-posting-info";
        const apiRes = await fetchWithTimeout(
          apiUrl,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobPostingId: jobId }),
          },
          3000,
        );

        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.title) {
            return {
              success: true,
              source: "api",
              data: {
                role_name: data.title,
                company_name: formatCompanyName(companySlug),
                link: url,
                platform: "Ashby",
                status: "Applied",
                description: htmlToPlainText(data.descriptionHtml || "").slice(0, 15000),
                location: data.locationName || "Remote",
              },
            };
          }
        }
      } catch {
        // Fallback
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Ashby posting" };
}
