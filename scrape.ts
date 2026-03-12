import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { Page } from 'playwright';

// Add the stealth plugin
chromium.use(stealth());

/**
 * Enhanced scraper using playwright-extra and puppeteer-extra-plugin-stealth
 * to bypass bot detection on sites like LinkedIn, Indeed, and Comeet.
 */
export const scrape = async (url: string) => {
  // Use a more realistic viewport and randomize it slightly if needed
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled', // Extra stealth
    ],
  });

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  try {
    // Navigate with a slightly more realistic timeout and wait strategy
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // Handle common overlays/modals that might block content (like LinkedIn's "Join to view")
    await handleModals(page);

    // Mimic human behavior with some scrolling and random delays
    await autoScroll(page);
    await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);

    // Extract job-related text only
    const pageText = await page.evaluate(() => {
      const ignoredTags = new Set([
        'script',
        'style',
        'header',
        'nav',
        'footer',
        'aside',
        'noscript',
        'iframe',
        'svg',
      ]);

      function extractText(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.nodeValue?.trim() || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();

          // Skip hidden elements or ignored tags
          const style = window.getComputedStyle(element);
          if (
            ignoredTags.has(tagName) ||
            style.display === 'none' ||
            style.visibility === 'hidden'
          ) {
            return '';
          }

          // Prioritize common job description containers if possible
          // But for general extraction, we traverse all children
          return Array.from(node.childNodes)
            .map(extractText)
            .filter((t) => t.length > 0)
            .join(' ')
            .trim();
        }
        return '';
      }

      // Try to focus on main content if available
      const mainContent =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.body;

      return extractText(mainContent);
    });

    // Clean up extra whitespace and limit length for LLM
    const cleanedText = pageText
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 4000)
      .join(' ');

    return cleanedText;
  } catch (err) {
    console.error(`Scraping failed for ${url}:`, err);
    return null;
  } finally {
    await browser.close();
  }
};

/**
 * Handle common popups or modals that might block content
 */
async function handleModals(page: Page) {
  try {
    // Common "Accept Cookies" buttons
    const cookieSelectors = [
      'button:has-text("Accept")',
      'button:has-text("Agree")',
      'button:has-text("Allow all")',
      '#onetrust-accept-btn-handler',
      '.cookie-banner__accept',
    ];

    for (const selector of cookieSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 })) {
        await page.click(selector);
        await page.waitForTimeout(500);
      }
    }
  } catch {
    // Ignore modal errors
  }
}

/**
 * Scroll helper function to mimic human behavior
 */
async function autoScroll(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 400; // Faster scroll distance
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 5000) {
          // Cap it to 5000px
          clearInterval(timer);
          resolve();
        }
      }, 150);
    });
  });
}
