import { extractDomainFromUrl, detectPlatformFromUrl } from "@/lib/utils";
import { formatQuotaExceededMessage } from "@/lib/ai-quota";
import type { AiData } from "@/lib/types";
import type { FormValues } from "./application-form";

export type ExtractJobResult =
  | {
      ok: true;
      /** The link as requested, with https:// added when it had no scheme. */
      url: string;
      domain: string;
      values: Partial<FormValues>;
    }
  | { ok: false; url: string; reason: "sign-in" | "failed" | "aborted" }
  | { ok: false; url: string; reason: "quota"; message: string | null };

const formatLocalTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

/**
 * Asks /api/extract for the details of a job posting and maps them to form
 * values. Fields the posting doesn't give come back as empty strings.
 */
export async function extractJobDetails(
  rawUrl: string,
  signal?: AbortSignal,
): Promise<ExtractJobResult> {
  const trimmed = rawUrl.trim();
  const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal,
    });

    if (response.status === 401) return { ok: false, url, reason: "sign-in" };

    if (response.status === 429) {
      const body: AiData = await response.json();
      const resetAt =
        body.status === "fail" && body.resetAt ? new Date(body.resetAt) : null;
      return {
        ok: false,
        url,
        reason: "quota",
        message:
          resetAt && body.status === "fail" && body.limit !== undefined
            ? formatQuotaExceededMessage(
                "extract",
                body.limit,
                resetAt,
                new Date(),
                formatLocalTime,
              )
            : null,
      };
    }

    if (!response.ok) return { ok: false, url, reason: "failed" };

    const aiData: AiData = await response.json();
    if (aiData.status === "fail" || !aiData.application) {
      return { ok: false, url, reason: "failed" };
    }

    return {
      ok: true,
      url,
      domain: extractDomainFromUrl(url) || "job posting",
      values: {
        role_name: aiData.application.role_name || "",
        company_name: aiData.application.company_name || "",
        link: url,
        platform:
          aiData.application.platform?.trim() || detectPlatformFromUrl(url),
        // Leave unknown locations empty so the form asks the user, rather
        // than presenting a guess as extracted data.
        location: aiData.application.location || "",
        description: aiData.application.description || "",
        salary: aiData.application.salary?.trim() || "",
      },
    };
  } catch (err) {
    if (signal?.aborted) return { ok: false, url, reason: "aborted" };
    console.error("Autofill extraction error:", err);
    return { ok: false, url, reason: "failed" };
  }
}
