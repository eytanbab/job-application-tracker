import { NextResponse } from 'next/server';
import { scraper } from '@/lib/scraper';
import { openAiclient } from '@/lib/open-ai';

export const maxDuration = 60; // Allow 60 seconds for scraping + AI extraction

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { status: 'fail', message: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Extracting from: ${url}`);
    const webpage = await scraper(url);

    if (!webpage) {
      console.error('[API] Scraper returned empty content.');
      return NextResponse.json({
        status: 'fail',
        message: 'Failed to extract raw content from the URL.',
      });
    }
    console.log(`[API] Scraper successful. Raw content length: ${webpage.length}`);

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

    console.log('[API] Sending prompt to OpenAI...');
    const response = await openAiclient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });
    
    const res = response.choices[0].message.content;
    console.log(`[API] OpenAI responded successfully. Result length: ${res?.length}`);
    console.log(`[API] Raw OpenAI Response: ${res}`);

    if (!res) {
      console.error('[API] OpenAI returned empty response content.');
      return NextResponse.json({
        status: 'fail',
        message: 'Failed to extract data from the URL.',
      });
    }

    return NextResponse.json(JSON.parse(res));
  } catch (error) {
    console.error('[API] Error in extraction API:', error);
    return NextResponse.json(
      {
        status: 'fail',
        message: 'Failed to extract information due to an error.',
      },
      { status: 500 }
    );
  }
}
