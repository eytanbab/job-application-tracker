import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseSmartRecruiters(url: string): Promise<ParseResult> {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    const parts = pathname.split("/").filter(Boolean);
    const companySlug = parts[0];
    let jobId = parts[1];

    if (jobId && jobId.includes("-")) {
      jobId = jobId.split("-")[0];
    }

    // 1. Direct SmartRecruiters Public API (~90ms)
    if (companySlug && jobId) {
      try {
        const apiUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(companySlug)}/postings/${encodeURIComponent(jobId)}`;
        const apiRes = await fetchWithTimeout(apiUrl, {}, 3000);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (data && data.name) {
            const roleName = data.name;
            const companyName = data.company?.name || formatCompanyName(companySlug);

            const locParts = [data.location?.city, data.location?.region, data.location?.country]
              .filter(Boolean);
            const location = locParts.length > 0 ? locParts.join(", ") : data.location?.remote ? "Remote" : "Remote";

            const sections = data.jobAd?.sections || {};
            const descParts: string[] = [];
            if (sections.companyDescription?.text) {
              descParts.push(`About the Company:\n${sections.companyDescription.text}`);
            }
            if (sections.jobDescription?.text) {
              descParts.push(`Job Description:\n${sections.jobDescription.text}`);
            }
            if (sections.qualifications?.text) {
              descParts.push(`Qualifications:\n${sections.qualifications.text}`);
            }
            if (sections.additionalInformation?.text) {
              descParts.push(`Additional Information:\n${sections.additionalInformation.text}`);
            }

            const description = htmlToPlainText(descParts.join("\n\n"));

            return {
              success: true,
              source: "api",
              data: {
                role_name: roleName,
                company_name: companyName,
                link: url,
                platform: "SmartRecruiters",
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
      return parseJsonLdJob(html, url, "SmartRecruiters");
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse SmartRecruiters posting" };
}
