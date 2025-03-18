import { chromium } from 'playwright';

export const scrape = async (url: string) => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Extract only meaningful job-related text
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
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue?.trim() || '';
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

  await browser.close();

  // Reduce text size to avoid token limit issues
  return pageText.split(' ').slice(0, 5000).join(' ');
};
