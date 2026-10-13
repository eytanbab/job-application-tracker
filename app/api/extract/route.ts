import { NextResponse } from "next/server";
import { ThinkingLevel } from "@google/genai";
import { scraper } from "@/lib/scraper";
import {
  generateContentWithRetry,
  geminiExtractionClient,
  getGeminiErrorUserMessage,
} from "@/lib/gemini";
import { tryDeterministicExtraction } from "@/lib/parsers";
import { validateSafeUrl } from "@/lib/security/url-validator";
import { requireSignedInUser } from "@/app/actions/_utils/require-signed-in-user";
import { consumeAiQuota, peekAiQuota, type AiQuotaResult } from "@/lib/ai-usage";
import { formatQuotaExceededMessage } from "@/lib/ai-quota";

export const maxDuration = 30;
// Stop retrying Gemini early enough to send a response before maxDuration.
const GEMINI_DEADLINE_MS = (maxDuration - 3) * 1000;
const isDevelopment = process.env.NODE_ENV === "development";

function quotaExceededResponse(quota: AiQuotaResult) {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((quota.resetAt.getTime() - Date.now()) / 1000),
  );
  return NextResponse.json(
    {
      status: "fail",
      code: "rate_limited",
      message: formatQuotaExceededMessage("extract", quota.limit, quota.resetAt),
      limit: quota.limit,
      resetAt: quota.resetAt.toISOString(),
    },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

export async function POST(req: Request) {
  const requestStart = Date.now();
  try {
    // AI autofill is for signed-in users only; guests enter details manually.
    const user = await requireSignedInUser();
    if (!user.ok) {
      return NextResponse.json(
        {
          status: "fail",
          code: "auth_required",
          message: "Sign in to autofill applications from a link.",
        },
        { status: 401 },
      );
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { status: "fail", message: "URL is required" },
        { status: 400 },
      );
    }

    const validation = validateSafeUrl(url);
    if (!validation.safe) {
      return NextResponse.json(
        { status: "fail", message: validation.error || "Invalid or forbidden URL" },
        { status: 400 },
      );
    }

    const safeUrl = validation.url!.toString();

    if (isDevelopment) {
      console.log(`[API] Extracting from: ${safeUrl}`);
    }

    // 1. Zero-AI Fast Path (Deterministic parsing for known platforms & JSON-LD)
    const startTime = Date.now();
    const deterministicData = await tryDeterministicExtraction(safeUrl);

    if (deterministicData && deterministicData.role_name && deterministicData.company_name) {
      if (isDevelopment) {
        console.log(
          `[API] Deterministic zero-AI extraction successful in ${Date.now() - startTime}ms:`,
          deterministicData.role_name,
          `@`,
          deterministicData.company_name,
        );
      }
      return NextResponse.json({
        status: "success",
        application: deterministicData,
      });
    }

    // 2. AI Fallback (For unparsed SPAs or non-standard HTML structures)
    if (isDevelopment) {
      console.log(
        `[API] Deterministic parser could not extract complete data. Falling back to Gemini 3.5 Flash-Lite...`,
      );
    }

    // Without a Gemini key there is no fallback extractor. Report failure so
    // the client keeps the link and switches to manual entry, rather than
    // filling the form with invented details.
    if (!process.env.GEMINI_EXTRACTION_API_KEY && !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        status: "fail",
        message:
          "Could not parse this posting, and AI extraction is not configured.",
      });
    }

    // Only calls that reach Gemini count against the daily limit. Check it
    // before scraping so users over the limit don't trigger scraper work.
    const quotaBeforeScrape = await peekAiQuota(user.userId, "extract");
    if (!quotaBeforeScrape.allowed) {
      return quotaExceededResponse(quotaBeforeScrape);
    }

    const webpage = await scraper(safeUrl);

    if (!webpage) {
      console.error("[API] Scraper returned empty content.");
      return NextResponse.json({
        status: "fail",
        message: "Failed to extract raw content from the URL.",
      });
    }

    const prompt = `You are an expert at extracting verbatim content from job listings.
Extract the PRIMARY job listing on this page.
Job Listing Link: ${url}

Return JSON with exact details:
- role_name: Exact job title
- company_name: Exact company name
- link: "${url}"
- platform: Inferred platform (e.g. LinkedIn, Greenhouse, Lever, Indeed, Company Site)
- status: "Applied"
- location: Job location (e.g. "San Francisco, CA" or "Remote")
- description: Full plain text job description including About the job, Responsibilities, and Requirements. Use simple line breaks for lists and do not use markdown symbols (*, #, _).

If no clear job listing is found, set status to 'fail'.

Webpage Content:
${webpage}`;

    // Charged once per request: retries below reuse this quota slot.
    const quota = await consumeAiQuota(user.userId, "extract");
    if (!quota.allowed) {
      return quotaExceededResponse(quota);
    }

    const response = await generateContentWithRetry(geminiExtractionClient, {
      model: "gemini-3.5-flash-lite",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["success", "fail"] },
            application: {
              type: "object",
              properties: {
                role_name: { type: "string" },
                company_name: { type: "string" },
                link: { type: "string" },
                platform: { type: "string" },
                status: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
              },
              required: [
                "role_name",
                "company_name",
                "link",
                "platform",
                "status",
                "description",
                "location",
              ],
            },
          },
          required: ["status", "application"],
        },
        // Gemini 3 models reject thinkingBudget: 0; MINIMAL is the
        // lowest-latency setting they accept.
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      },
    }, {
      deadline: requestStart + GEMINI_DEADLINE_MS,
      label: "API",
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error(
        "[API] Gemini returned no candidates (possibly safety block).",
      );
      return NextResponse.json({
        status: "fail",
        message: "AI failed to extract data (content blocked or empty).",
      });
    }

    const res = response.text || "";

    if (!res) {
      console.error("[API] Gemini returned empty response content.");
      return NextResponse.json({
        status: "fail",
        message: "Failed to extract data from the URL.",
      });
    }

    return NextResponse.json(JSON.parse(res));
  } catch (error) {
    console.error("[API] Error in extraction API:", error);
    const busyMessage = getGeminiErrorUserMessage(error);
    return NextResponse.json(
      {
        status: "fail",
        message: busyMessage ?? "Failed to extract information due to an error.",
      },
      { status: busyMessage ? 503 : 500 },
    );
  }
}
