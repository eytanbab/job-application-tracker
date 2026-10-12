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

      // Check modern Ashby DOM selectors in HTML
      const h1Match = html.match(/<h1[^>]*class=["'][^"']*ashby-job-posting-heading[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
                      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const logoAltMatch = html.match(/class=["'][^"']*_navLogoLink_[^"']*["'][^>]*><img[^>]*alt=["']([^"']+)["']/i) ||
                           html.match(/aria-label=["']Back to ([^’']+)[’']s Job Listings["']/i);
      const locMatch = html.match(/<h2[^>]*>Location<\/h2>\s*<p>([^<]+)<\/p>/i);
      const locTypeMatch = html.match(/<h2[^>]*>Location Type<\/h2>\s*<p>([^<]+)<\/p>/i);
      const descMatch = html.match(/class=["'][^"']*ashby-job-posting-description[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      let parsedRole = h1Match?.[1]?.trim() || "";
      let parsedCompany = logoAltMatch?.[1]?.trim() || (companySlug ? formatCompanyName(companySlug) : "");

      if (!parsedRole && titleMatch?.[1]) {
        const fullTitle = titleMatch[1].trim();
        if (fullTitle.includes(" @ ")) {
          const parts = fullTitle.split(" @ ");
          parsedRole = parts[0].trim();
          if (!parsedCompany && parts[1]) parsedCompany = parts[1].trim();
        } else {
          parsedRole = fullTitle;
        }
      }

      if (parsedRole && parsedCompany) {
        if (parsedRole.toLowerCase().endsWith(` - ${parsedCompany.toLowerCase()}`)) {
          parsedRole = parsedRole.slice(0, -(parsedCompany.length + 3)).trim();
        }

        let locStr = locMatch?.[1]?.trim() || "Remote";
        if (locTypeMatch?.[1] && !locStr.toLowerCase().includes(locTypeMatch[1].toLowerCase())) {
          locStr += ` (${locTypeMatch[1].trim()})`;
        }

        const rawDesc = descMatch?.[1] || "";
        const description = htmlToPlainText(rawDesc);

        return {
          success: true,
          source: "dom",
          data: {
            role_name: parsedRole,
            company_name: parsedCompany,
            link: url,
            platform: "Ashby",
            status: "Applied",
            description: description.slice(0, 15000),
            location: locStr,
          },
        };
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
