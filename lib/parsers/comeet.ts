import { ParseResult } from "./types";
import { fetchWithTimeout, formatCompanyName, htmlToPlainText } from "./utils";
import { parseJsonLdJob } from "./jsonld";

export async function parseComeet(url: string): Promise<ParseResult> {
  try {
    const htmlRes = await fetchWithTimeout(url, {}, 3500);
    if (!htmlRes.ok) {
      return { success: false, error: `Failed to fetch Comeet page: ${htmlRes.status}` };
    }

    const html = await htmlRes.text();

    // 1. Check embedded POSITION_DATA and COMPANY_DATA objects
    const posMatch = html.match(/POSITION_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:var\s+|CANDIDATE_DATA|RECAPTCHA)/i);
    const compMatch = html.match(/COMPANY_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:var\s+|COMPANY_POSITIONS)/i);

    let roleName = "";
    let companyName = "";
    let location = "Remote";
    let description = "";

    if (posMatch?.[1]) {
      try {
        const pos = JSON.parse(posMatch[1]);
        if (pos.name) {
          roleName = pos.name;
        }

        if (pos.company_name) {
          companyName = pos.company_name;
        }

        // Location formatting
        const locParts: string[] = [];
        if (pos.location?.name) locParts.push(pos.location.name);
        else if (pos.location?.city) locParts.push(pos.location.city);
        if (pos.location?.country && pos.location.country !== pos.location?.name) {
          locParts.push(pos.location.country);
        }
        if (locParts.length > 0) {
          location = locParts.join(", ");
          if (pos.workplace_type && !location.toLowerCase().includes(pos.workplace_type.toLowerCase())) {
            location += ` (${pos.workplace_type})`;
          }
        } else if (pos.workplace_type) {
          location = pos.workplace_type;
        }

        // Description & requirements formatting
        if (Array.isArray(pos.custom_fields?.details) && pos.custom_fields.details.length > 0) {
          const detailSections = pos.custom_fields.details
            .filter((d: any) => d && d.value)
            .map((d: any) => {
              const label = d.name ? `## ${d.name}\n` : "";
              return `${label}${htmlToPlainText(d.value)}`;
            });
          description = detailSections.join("\n\n");
        } else if (pos.description) {
          description = htmlToPlainText(pos.description);
        }
      } catch (e) {
        console.warn("Failed to parse POSITION_DATA JSON:", e);
      }
    }

    // Supplementary company extraction from COMPANY_DATA if missing
    if (!companyName && compMatch?.[1]) {
      try {
        const comp = JSON.parse(compMatch[1]);
        if (comp.name) companyName = comp.name;
      } catch {}
    }

    // 2. OpenGraph / Title fallbacks if JSON parsing missed anything
    if (!roleName || !companyName) {
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

      if (ogTitle) {
        const cleanTitle = ogTitle.replace(/^Job opportunity:\s*/i, "").trim();
        if (cleanTitle.includes(" at ")) {
          const parts = cleanTitle.split(" at ");
          if (!roleName) roleName = parts[0].trim();
          if (!companyName) companyName = parts[1].split(/[|•-]/)[0].trim();
        } else if (!roleName) {
          roleName = cleanTitle;
        }
      }
    }

    if (!description) {
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
      if (ogDesc) {
        description = ogDesc.trim();
      }
    }

    if (!companyName) {
      // Extract from URL: https://www.comeet.com/jobs/{company}/...
      try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split("/").filter(Boolean);
        if (pathParts[0] === "jobs" && pathParts[1]) {
          companyName = formatCompanyName(pathParts[1]);
        }
      } catch {}
    }

    if (roleName && companyName) {
      return {
        success: true,
        source: "dom",
        data: {
          role_name: roleName,
          company_name: companyName,
          link: url,
          platform: "Comeet",
          status: "Applied",
          description: description.slice(0, 15000),
          location,
        },
      };
    }

    // 3. Fall back to generic JSON-LD
    const jsonLdResult = parseJsonLdJob(html, url, "Comeet");
    if (jsonLdResult.success) {
      return jsonLdResult;
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "Unable to parse Comeet job posting" };
}
