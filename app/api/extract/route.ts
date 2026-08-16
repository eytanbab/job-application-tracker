import { NextResponse } from "next/server";
import { scraper } from "@/lib/scraper";
import { geminiClient } from "@/lib/gemini";
import { tryDeterministicExtraction } from "@/lib/parsers";

export const maxDuration = 30;
const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { status: "fail", message: "URL is required" },
        { status: 400 },
      );
    }

    if (isDevelopment) {
      console.log(`[API] Extracting from: ${url}`);
    }

    // 1. Zero-AI Fast Path (Deterministic parsing for known platforms & JSON-LD)
    const startTime = Date.now();
    const deterministicData = await tryDeterministicExtraction(url);

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
        `[API] Deterministic parser could not extract complete data. Falling back to Gemini 2.5 Flash-Lite...`,
      );
    }

    const webpage = await scraper(url);

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

    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash-lite",
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
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
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
    return NextResponse.json(
      {
        status: "fail",
        message: "Failed to extract information due to an error.",
      },
      { status: 500 },
    );
  }
}
