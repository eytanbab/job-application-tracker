import { chromium, Page } from 'playwright';

export const scrape = async (url: string) => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Optional: Scroll to bottom to trigger lazy loading
    await autoScroll(page);

    // Wait for some time to let any JS-rendered content load
    await page.waitForTimeout(2000);

    // Extract job-related text only
    const pageText = await page.evaluate(() => {
      const ignoredTags = new Set([
        'script',
        'style',
        'header',
        'nav',
        'footer',
        'aside',
      ]);
      function extractText(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE)
          return node.nodeValue?.trim() || '';
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          !ignoredTags.has((node as HTMLElement).tagName.toLowerCase())
        ) {
          return Array.from(node.childNodes).map(extractText).join(' ').trim();
        }
        return '';
      }
      return extractText(document.body);
    });

    return pageText.split(' ').slice(0, 5000).join(' ');
  } catch (err) {
    console.error('Scraping failed:', err);
    return null;
  } finally {
    await browser.close();
  }
};

// Scroll helper function to mimic human behavior
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}
