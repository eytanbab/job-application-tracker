/**
 * Production-ready scraper for Vercel.
 * Uses r.jina.ai as a high-performance proxy and falls back to direct HTML fetch + meta parsing.
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
        'X-No-Cache': 'true',
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const text = await response.text();
      console.log(`[Scraper] Jina responded successfully. Length: ${text?.length}`);
      if (text && text.length > 200) {
        return text.slice(0, 50000);
      }
      console.warn('[Scraper] Jina returned text that was too short.');
    } else {
      console.error(`[Scraper] Jina returned error status: ${response.status}`);
    }
  } catch (error) {
    console.error('[Scraper] Jina Reader failed:', error);
  }

  // 2. Direct HTML fetch with OpenGraph / JSON-LD extraction fallback
  try {
    console.log(`[Scraper] Direct fetching HTML: ${url}`);
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (htmlRes.ok) {
      const html = await htmlRes.text();
      const metaTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
      const metaDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                       html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
      const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

      const cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();

      const combined = `Meta Title: ${metaTitle}\nSite Name: ${siteName}\nMeta Description: ${metaDesc}\n\nPage Text:\n${cleanText.slice(0, 30000)}`;
      if (combined.length > 100) {
        return combined;
      }
    }
  } catch (err) {
    console.error('[Scraper] Direct HTML fetch fallback failed:', err);
  }

  // 3. Standalone Microservice fallback (If deployed)
  if (process.env.SCRAPER_SERVICE_URL) {
    try {
      const response = await fetch(`${process.env.SCRAPER_SERVICE_URL}/scrape?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        return data.text || '';
      }
    } catch (err) {
      console.error('Custom Scraper Service failed:', err);
    }
  }

  // 4. Local Playwright Fallback (Development machine)
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
