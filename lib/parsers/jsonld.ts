import { ParsedJob, ParseResult } from "./types";
import { htmlToPlainText, formatCompanyName } from "./utils";

export function parseJsonLdJob(html: string, url: string, platformHint?: string): ParseResult {
  try {
    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const items = Array.isArray(parsed)
          ? parsed
          : parsed["@graph"] && Array.isArray(parsed["@graph"])
            ? parsed["@graph"]
            : [parsed];

        const jobPosting = items.find(
          (item: Record<string, unknown>) =>
            item &&
            (item["@type"] === "JobPosting" ||
              (Array.isArray(item["@type"]) &&
                item["@type"].includes("JobPosting"))),
        );

        if (jobPosting) {
          const title = (jobPosting.title || jobPosting.name || "") as string;
          
          let company = "";
          if (
            typeof jobPosting.hiringOrganization === "object" &&
            jobPosting.hiringOrganization !== null
          ) {
            company =
              ((jobPosting.hiringOrganization as Record<string, unknown>).name as string) ||
              "";
          } else if (typeof jobPosting.hiringOrganization === "string") {
            company = jobPosting.hiringOrganization;
          }

          let location = "";
          if (jobPosting.jobLocation) {
            if (typeof jobPosting.jobLocation === "string") {
              location = jobPosting.jobLocation;
            } else if (Array.isArray(jobPosting.jobLocation)) {
              location = jobPosting.jobLocation
                .flatMap((loc: Record<string, unknown>) => {
                  const addr = loc.address as Record<string, unknown> | undefined;
                  const str = addr
                    ? [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                        .filter(Boolean)
                        .join(", ")
                    : "";
                  return str ? [str] : [];
                })
                .join(" / ");
            } else if (typeof jobPosting.jobLocation === "object") {
              const addr = (jobPosting.jobLocation as Record<string, unknown>)
                .address as Record<string, unknown> | undefined;
              location = addr
                ? [addr.addressLocality, addr.addressRegion, addr.addressCountry]
                    .filter(Boolean)
                    .join(", ")
                : "";
            }
          }

          // In case job location type is TELECOMMUTE / Remote
          if (
            !location &&
            (jobPosting.applicantLocationRequirements ||
              jobPosting.jobLocationType === "TELECOMMUTE")
          ) {
            location = "Remote";
          }

          const rawDesc = (jobPosting.description as string) || "";
          const description = htmlToPlainText(rawDesc);

          let salary: string | undefined = undefined;
          if (jobPosting.baseSalary) {
            if (typeof jobPosting.baseSalary === "object") {
              const val = (jobPosting.baseSalary as Record<string, unknown>).value as
                | Record<string, unknown>
                | number
                | string
                | undefined;
              const currency =
                ((jobPosting.baseSalary as Record<string, unknown>).currency as string) || "$";
              if (typeof val === "object" && val !== null) {
                const min = val.minValue ?? "";
                const max = val.maxValue ?? "";
                const unit = val.unitText ? `/${val.unitText}` : "";
                if (min && max) salary = `${currency}${min} - ${currency}${max}${unit}`;
                else if (min || max) salary = `${currency}${min || max}${unit}`;
              } else if (val) {
                salary = `${currency}${val}`;
              }
            }
          }

          if (title && (company || location || description)) {
            return {
              success: true,
              source: "json-ld",
              data: {
                role_name: title.trim(),
                company_name: formatCompanyName(company),
                link: url,
                platform: platformHint || "Direct Apply",
                status: "Applied",
                description: description.slice(0, 15000),
                location: location.trim() || "Remote",
                salary,
              },
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }

  return { success: false, error: "No JobPosting JSON-LD found" };
}
