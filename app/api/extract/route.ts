import { NextResponse } from "next/server";
import { scraper } from "@/lib/scraper";
import { geminiClient } from "@/lib/gemini";

export const maxDuration = 60; // Allow 60 seconds for scraping + AI extraction
const isDevelopment = process.env.NODE_ENV === "development";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { status: "fail", message: "URL is required" },
        { status: 400 }
      );
    }

    if (isDevelopment) {
      console.log(`[API] Extracting from: ${url}`);
    }
    const webpage = await scraper(url);

    if (!webpage) {
      console.error("[API] Scraper returned empty content.");
      return NextResponse.json({
        status: "fail",
        message: "Failed to extract raw content from the URL.",
      });
    }
    if (isDevelopment) {
      console.log(
        `[API] Scraper successful. Raw content length: ${webpage.length}`
      );
    }

    const prompt = `You are an expert at extracting verbatim content from job listings.
The provided text is a webpage converted to markdown. It may contain a lot of noise (menus, footers, other jobs).
Your goal is to find the PRIMARY job listing on this page and extract its details.

Return a JSON object:
{
  "status": "success",
  "application": {
    "role_name": "Exact job title",
    "company_name": "Exact company name",
    "link": "${url}",
    "platform": "Inferred platform",
    "status": "Applied",
    "description": "COPY AND PASTE THE ENTIRE JOB DESCRIPTION VERBATIM as PLAIN TEXT. 
      You MUST include the full text of sections like 'About the job', 'Responsibilities', 'Requirements', etc.
      DO NOT use any Markdown symbols (no '###', '**', '*', '__'). 
      For lists, use simple line breaks.
      If you find the job listing, do not truncate it. If you cannot find a clear job listing, set status to 'fail'.",
    "location": "Job location"
  }
}

Content to parse:
\n\n${webpage}`;

    if (isDevelopment) {
      console.log("[API] Sending prompt to Gemini...");
    }

    const response = await geminiClient.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error(
        "[API] Gemini returned no candidates (possibly safety block)."
      );
      return NextResponse.json({
        status: "fail",
        message: "AI failed to extract data (content blocked or empty).",
      });
    }

    const res = response.text || "";

    if (isDevelopment) {
      console.log(
        `[API] Gemini responded successfully. Result length: ${res?.length}`
      );
    }

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
      { status: 500 }
    );
  }
}
