export const scraper = async (url: string): Promise<string> => {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (!apiKey) throw new Error('Missing ScrapingBee API key');

  const res = await fetch(
    `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=${encodeURIComponent(
      url
    )}&render_js=true`,
    {
      cache: 'no-store',
    }
  );

  if (!res.ok) throw new Error('Failed to scrape page');

  return await res.text(); // raw HTML
};
