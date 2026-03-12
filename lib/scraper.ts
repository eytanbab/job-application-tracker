/**
 * Production-ready scraper for Vercel.
 * Uses r.jina.ai as a high-performance, free proxy that bypasses bot detection
 * and returns LLM-friendly content. Falls back to local playwright for development.
 */
export const scraper = async (url: string): Promise<string> => {
  console.log(`[Scraper] Starting extraction for: ${url}`);
  // 1. Try Jina Reader first (Best for Vercel/Production)
  try {
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    console.log(`[Scraper] Fetching from Jina: ${jinaUrl}`);
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/event-stream',
        'X-No-Cache': 'true'
      },
      next: { revalidate: 3600 } 
    });

    if (response.ok) {
      const text = await response.text();
      console.log(`[Scraper] Jina responded successfully. Length: ${text?.length}`);
      if (text && text.length > 200) {
        return text.slice(0, 50000); // 50k chars to ensure we reach the job description
      }
      console.warn('[Scraper] Jina returned text that was too short.');
    } else {
      console.error(`[Scraper] Jina returned error status: ${response.status}`);
    }
  } catch (error) {
    console.error('[Scraper] Jina Reader failed:', error);
  }

  // 2. Fallback: Standalone Microservice (If you deployed one)
  if (process.env.SCRAPER_SERVICE_URL) {
    try {
      const response = await fetch(`${process.env.SCRAPER_SERVICE_URL}/scrape?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      return data.text || '';
    } catch (err) {
      console.error('Custom Scraper Service failed:', err);
    }
  }

  // 3. Local Fallback (Only works on your local machine)
  if (process.env.NODE_ENV === 'development') {
    try {
      const { chromium } = await import('playwright-extra');
      const stealth = (await import('puppeteer-extra-plugin-stealth')).default;
      chromium.use(stealth());
      
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });
      const content = await page.evaluate(() => document.body.innerText);
      await browser.close();
      return content;
    } catch (err) {
      console.error('Local playwright failed:', err);
    }
  }

  return '';
};
