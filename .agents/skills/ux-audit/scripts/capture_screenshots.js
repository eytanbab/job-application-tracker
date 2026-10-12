/**
 * Multi-viewport screenshot capture helper for the ux-audit skill.
 *
 * Read-only execution: Only navigates and captures screenshots across viewports.
 * Does not submit forms, click mutating buttons, or execute destructive actions.
 *
 * For each width it saves:
 *   <width>w-fold.png  the first screen (what users see before scrolling)
 *   <width>w.png       the full page
 *
 * Usage:
 *   node capture_screenshots.js <url> <output_dir> [widths] [settle_delay_ms] [--color-scheme dark] [--storage-state auth.json]
 *
 * Example:
 *   node capture_screenshots.js http://localhost:3000/signup .ux-audit/screenshots/2026-08-22-signup 375,768,1440 800
 */

const fs = require('fs');
const path = require('path');
const { loadPlaywright } = require('./lib/resolve');

// Typical first-screen heights for each device class
function viewportHeight(width) {
  if (width < 600) return 812;
  if (width < 1024) return 1024;
  return 900;
}

async function settle(page, settleDelayMs) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  if (settleDelayMs > 0) await page.waitForTimeout(settleDelayMs);
}

async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--color-scheme') flags.colorScheme = args[++i];
    else if (args[i] === '--storage-state') flags.storageState = args[++i];
    else positional.push(args[i]);
  }
  const [url, outDir, widthArg, delayArg] = positional;

  if (!url || !outDir) {
    console.error(JSON.stringify({
      ok: false,
      error: 'Usage: node capture_screenshots.js <url> <output_dir> [widths] [settle_delay_ms] [--color-scheme dark] [--storage-state auth.json]'
    }, null, 2));
    process.exit(1);
  }

  let chromium;
  try {
    chromium = loadPlaywright().chromium;
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(1);
  }

  const widths = widthArg
    ? widthArg.split(',').map((w) => parseInt(w.trim(), 10)).filter(Boolean)
    : [375, 768, 1440]; // standard mobile, tablet, and desktop viewports

  // Settle delay allows web fonts to load, client-side hydration to complete, and CSS transitions to settle
  const settleDelayMs = delayArg ? parseInt(delayArg, 10) || 0 : 800;

  const resolvedOutDir = path.resolve(outDir);
  fs.mkdirSync(resolvedOutDir, { recursive: true });

  let browser;
  const results = [];

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      deviceScaleFactor: 2, // High-DPI capture for crisp audit rendering
      ...(flags.colorScheme ? { colorScheme: flags.colorScheme } : {}),
      ...(flags.storageState ? { storageState: flags.storageState } : {}),
    });

    for (const width of widths) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: viewportHeight(width) });

      try {
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await settle(page, settleDelayMs);

        const fold = path.join(resolvedOutDir, `${width}w-fold.png`);
        const full = path.join(resolvedOutDir, `${width}w.png`);
        await page.screenshot({ path: fold, fullPage: false });
        await page.screenshot({ path: full, fullPage: true });

        results.push({
          width,
          fold: path.relative(process.cwd(), fold),
          full: path.relative(process.cwd(), full),
          ok: true
        });
      } catch (err) {
        results.push({ width, ok: false, error: err.message });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } catch (launchErr) {
    console.error(JSON.stringify({
      ok: false,
      error: `Browser launch failed: ${launchErr.message}`
    }, null, 2));
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  // Output structured JSON summary for the host agent to parse
  console.log(JSON.stringify(results, null, 2));

  if (results.length === 0 || results.every((r) => !r.ok)) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
});
