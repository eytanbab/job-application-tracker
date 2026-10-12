/**
 * Rendered-page inspection for the ux-audit skill (Interactive mode).
 *
 * For each viewport width it collects evidence that can be rated "Observed":
 *   - Screenshots: first screen (<w>w-fold.png) and full page (<w>w.png)
 *   - axe-core accessibility results (WCAG 2.0/2.1/2.2 A+AA, plus best practices), if axe-core is installed
 *   - Page structure: title, lang, heading outline, landmarks
 *   - Touch targets (widths < 768): sizes vs. WCAG 2.5.8 (24px) and platform guidance (44px)
 *   - Keyboard walk (widest width): Tab order, accessible names, visible focus change, obscured focus (WCAG 2.4.11)
 *   - Console errors and uncaught page errors
 *
 * Read-only: it only navigates, presses Tab, and reads the DOM. It never clicks, types, or submits.
 *
 * Usage:
 *   node inspect_page.js <url> <output_dir> [options]
 *
 * Options:
 *   --widths 375,1440        Viewport widths (default 375,1440)
 *   --tabs 40                Max Tab presses in the keyboard walk (default 40)
 *   --settle 800             Extra settle delay in ms after load (default 800)
 *   --color-scheme dark      Emulate prefers-color-scheme (light | dark)
 *   --reduced-motion         Emulate prefers-reduced-motion: reduce
 *   --storage-state auth.json  Playwright storage state for signed-in pages
 *   --focus-shots            Save a cropped screenshot of each focus stop (focus/NN.png)
 *   --no-axe | --no-keyboard | --no-targets   Skip a check
 *
 * Output: detailed JSON per width in <output_dir>/inspect-<width>.json, and a compact summary on stdout.
 */

const fs = require('fs');
const path = require('path');
const { loadPlaywright, resolveAxe } = require('./lib/resolve');

function parseArgs(argv) {
  const opts = {
    widths: [375, 1440], tabs: 40, settle: 800, colorScheme: null, reducedMotion: false,
    storageState: null, focusShots: false, axe: true, keyboard: true, targets: true,
  };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--widths') opts.widths = argv[++i].split(',').map((w) => parseInt(w, 10)).filter(Boolean);
    else if (a === '--tabs') opts.tabs = parseInt(argv[++i], 10) || opts.tabs;
    else if (a === '--settle') opts.settle = parseInt(argv[++i], 10) || 0;
    else if (a === '--color-scheme') opts.colorScheme = argv[++i];
    else if (a === '--reduced-motion') opts.reducedMotion = true;
    else if (a === '--storage-state') opts.storageState = argv[++i];
    else if (a === '--focus-shots') opts.focusShots = true;
    else if (a === '--no-axe') opts.axe = false;
    else if (a === '--no-keyboard') opts.keyboard = false;
    else if (a === '--no-targets') opts.targets = false;
    else positional.push(a);
  }
  [opts.url, opts.outDir] = positional;
  return opts;
}

function viewportHeight(width) {
  if (width < 600) return 812;
  if (width < 1024) return 1024;
  return 900;
}

async function settle(page, ms) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
  if (ms > 0) await page.waitForTimeout(ms);
}

// Helpers installed into the page once per load.
function installHelpers() {
  const text = (s, n = 80) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  window.__uxa = {
    accName(el) {
      const labelledby = el.getAttribute('aria-labelledby');
      if (labelledby) {
        const t = labelledby.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((n) => n.textContent).join(' ');
        if (text(t)) return text(t);
      }
      if (el.getAttribute('aria-label')) return text(el.getAttribute('aria-label'));
      if (el.labels && el.labels.length) return text([...el.labels].map((l) => l.textContent).join(' '));
      const inner = text(el.innerText || el.textContent);
      if (inner) return inner;
      const img = el.querySelector && el.querySelector('img[alt]');
      if (img && img.alt) return text(img.alt);
      return text(el.getAttribute('title') || el.getAttribute('placeholder') || el.value || '');
    },
    selector(el) {
      const parts = [];
      let node = el;
      for (let depth = 0; node && node.nodeType === 1 && depth < 4; depth++) {
        let part = node.tagName.toLowerCase();
        if (node.id) { parts.unshift(`${part}#${node.id}`); break; }
        const cls = [...node.classList].filter((c) => !c.includes(':') && c.length < 30).slice(0, 2);
        if (cls.length) part += '.' + cls.join('.');
        const parent = node.parentElement;
        if (parent) {
          const same = [...parent.children].filter((c) => c.tagName === node.tagName);
          if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = parent;
      }
      return parts.join(' > ');
    },
    focusStyle(el) {
      const cs = getComputedStyle(el);
      return [
        `outline:${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
        `shadow:${cs.boxShadow}`,
        `border:${cs.borderTopColor} ${cs.borderTopWidth}`,
        `bg:${cs.backgroundColor}`,
        `color:${cs.color}`,
        `decoration:${cs.textDecorationLine}`,
      ].join('|');
    },
  };
}

async function runAxe(page, axePath) {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async () => {
    const r = await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    });
    const shape = (item) => ({
      id: item.id,
      impact: item.impact,
      wcag: item.tags.filter((t) => /^wcag\d/.test(t)),
      best_practice_only: !item.tags.some((t) => /^wcag\d/.test(t)),
      help: item.help,
      help_url: item.helpUrl,
      node_count: item.nodes.length,
      nodes: item.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.slice(0, 200),
        summary: (n.failureSummary || '').slice(0, 300),
      })),
    });
    return { violations: r.violations.map(shape), needs_review: r.incomplete.map(shape) };
  });
}

async function readStructure(page) {
  return page.evaluate(() => {
    const t = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    return {
      title: document.title,
      lang: document.documentElement.getAttribute('lang'),
      headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')]
        .slice(0, 60)
        .map((h) => ({ level: Number(h.getAttribute('aria-level')) || Number(h.tagName[1]) || null, text: t(h.textContent) })),
      landmarks: [...document.querySelectorAll('header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo],[role=search],form[aria-label],form[aria-labelledby]')]
        .map((l) => l.getAttribute('role') || l.tagName.toLowerCase()),
      horizontal_overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

async function measureTargets(page) {
  return page.evaluate(() => {
    const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[tabindex]:not([tabindex="-1"])';
    const els = [...document.querySelectorAll(sel)].filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !el.disabled && !el.closest('[aria-hidden="true"],[inert]');
    });
    const rectOf = (el) => {
      // Checkboxes/radios: an associated label is part of the target
      let r = el.getBoundingClientRect();
      let { left, top, right, bottom } = r;
      if (el.labels) {
        for (const l of el.labels) {
          const lr = l.getBoundingClientRect();
          if (lr.width && lr.height) {
            left = Math.min(left, lr.left); top = Math.min(top, lr.top);
            right = Math.max(right, lr.right); bottom = Math.max(bottom, lr.bottom);
          }
        }
      }
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    };
    const rects = els.map(rectOf);
    const isInline = (el) => el.tagName === 'A' && el.parentElement &&
      [...el.parentElement.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    const distToRect = (x, y, r) => {
      const dx = Math.max(r.left - x, 0, x - r.right);
      const dy = Math.max(r.top - y, 0, y - r.bottom);
      return Math.hypot(dx, dy);
    };

    const items = [];
    let below44 = 0;
    let failing = 0;
    els.forEach((el, i) => {
      const r = rects[i];
      if (r.width >= 44 && r.height >= 44) return;
      below44++;
      const below24 = r.width < 24 || r.height < 24;
      const inline = isInline(el);
      let spacingOk = true;
      if (below24) {
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        rects.forEach((o, j) => {
          if (j === i || !spacingOk) return;
          const oSmall = o.width < 24 || o.height < 24;
          const d = oSmall
            ? Math.hypot(cx - (o.left + o.width / 2), cy - (o.top + o.height / 2)) // two 24px circles
            : distToRect(cx, cy, o);
          if (d < (oSmall ? 24 : 12)) spacingOk = false;
        });
      }
      const fails = below24 && !inline && !spacingOk;
      if (fails) failing++;
      items.push({
        selector: window.__uxa.selector(el),
        name: window.__uxa.accName(el),
        width: Math.round(r.width),
        height: Math.round(r.height),
        below_24: below24,
        inline_link_exception: inline,
        spacing_exception: below24 && spacingOk,
        fails_2_5_8: fails,
      });
    });
    items.sort((a, b) => Number(b.fails_2_5_8) - Number(a.fails_2_5_8) || a.width * a.height - b.width * b.height);
    return { interactive_elements: els.length, below_44px: below44, failing_wcag_2_5_8: failing, items: items.slice(0, 50) };
  });
}

async function keyboardWalk(page, maxTabs, focusDir) {
  await page.evaluate(() => {
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    window.scrollTo(0, 0);
  });

  const stops = [];
  let firstSelector = null;
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate((idx) => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return { idx, body: true };
      // Keep the first index: when focus wraps back to the first element, its marker must survive.
      if (!el.hasAttribute('data-uxa-focus')) el.setAttribute('data-uxa-focus', String(idx));
      const r = el.getBoundingClientRect();
      const cx = Math.min(Math.max(r.left + r.width / 2, 0), window.innerWidth - 1);
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight - 1);
      const topEl = document.elementFromPoint(cx, cy);
      const offscreen = r.bottom <= 0 || r.top >= window.innerHeight || r.right <= 0 || r.left >= window.innerWidth;
      const obscured = !offscreen && topEl && !(topEl === el || el.contains(topEl) || topEl.contains(el) ||
        (el.labels && [...el.labels].some((l) => l.contains(topEl))));
      return {
        idx,
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role'),
        name: window.__uxa.accName(el),
        selector: window.__uxa.selector(el),
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        focused_style: window.__uxa.focusStyle(el),
        obscured_by: obscured ? window.__uxa.selector(topEl) : null,
        offscreen,
      };
    }, i);

    if (info.body) {
      stops.push({ idx: i, note: 'Focus on <body> (left the page content or reached the end)' });
      if (stops.length > 1 && stops[stops.length - 2].note) break;
      continue;
    }
    if (firstSelector && info.selector === firstSelector) break; // completed a full cycle
    if (!firstSelector) firstSelector = info.selector;

    if (focusDir) {
      const pad = 12;
      const clip = {
        x: Math.max(info.rect.x - pad, 0),
        y: Math.max(info.rect.y - pad, 0),
        width: Math.max(info.rect.w + pad * 2, 1),
        height: Math.max(info.rect.h + pad * 2, 1),
      };
      await page.screenshot({ path: path.join(focusDir, `${String(i).padStart(2, '0')}.png`), clip }).catch(() => {});
    }
    stops.push(info);
  }

  // Compare focused styles with unfocused styles to detect missing focus indicators.
  const unfocused = await page.evaluate(() => {
    if (document.activeElement) document.activeElement.blur();
    const out = {};
    document.querySelectorAll('[data-uxa-focus]').forEach((el) => {
      out[el.getAttribute('data-uxa-focus')] = window.__uxa.focusStyle(el);
      el.removeAttribute('data-uxa-focus');
    });
    return out;
  });

  const elementStops = stops.filter((s) => !s.note);
  for (const s of elementStops) {
    s.visible_focus_change = unfocused[s.idx] !== undefined ? unfocused[s.idx] !== s.focused_style : null;
    delete s.focused_style;
  }

  return {
    stops_recorded: elementStops.length,
    no_visible_focus_change: elementStops.filter((s) => s.visible_focus_change === false).length,
    obscured_focus: elementStops.filter((s) => s.obscured_by).length,
    unnamed_stops: elementStops.filter((s) => !s.name).length,
    note: 'visible_focus_change=false compares computed outline, box-shadow, border, background, color, and text-decoration. Indicators drawn with pseudo-elements or on a parent are not detected, so confirm with --focus-shots or a screenshot before filing.',
    stops,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.url || !opts.outDir) {
    console.error(JSON.stringify({ ok: false, error: 'Usage: node inspect_page.js <url> <output_dir> [--widths 375,1440] [--tabs 40] [--color-scheme dark] [--reduced-motion] [--storage-state auth.json] [--focus-shots] [--no-axe] [--no-keyboard] [--no-targets]' }, null, 2));
    process.exit(1);
  }

  let playwright;
  try {
    playwright = loadPlaywright();
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
    process.exit(1);
  }

  const axePath = opts.axe ? resolveAxe() : null;
  const outDir = path.resolve(opts.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const widest = Math.max(...opts.widths);

  const browser = await playwright.chromium.launch({ headless: true });
  const summary = { url: opts.url, emulation: { color_scheme: opts.colorScheme || 'default', reduced_motion: opts.reducedMotion }, widths: [] };
  if (opts.axe && !axePath) {
    summary.axe_unavailable = 'axe-core is not installed in this project. Ask the developer before installing: npm install -D axe-core';
  }

  try {
    const context = await browser.newContext({
      deviceScaleFactor: 2,
      bypassCSP: true, // allows injecting axe-core on pages with a strict Content-Security-Policy
      ...(opts.colorScheme ? { colorScheme: opts.colorScheme } : {}),
      ...(opts.reducedMotion ? { reducedMotion: 'reduce' } : {}),
      ...(opts.storageState ? { storageState: opts.storageState } : {}),
    });

    for (const width of opts.widths) {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
      page.on('pageerror', (e) => consoleErrors.push(`Uncaught: ${String(e.message).slice(0, 300)}`));
      await page.setViewportSize({ width, height: viewportHeight(width) });

      const result = { width, ok: true };
      try {
        await page.goto(opts.url, { waitUntil: 'load', timeout: 30000 });
        await settle(page, opts.settle);
        await page.evaluate(installHelpers);

        const fold = path.join(outDir, `${width}w-fold.png`);
        const full = path.join(outDir, `${width}w.png`);
        await page.screenshot({ path: fold });
        await page.screenshot({ path: full, fullPage: true });
        result.screenshots = { fold: path.relative(process.cwd(), fold), full: path.relative(process.cwd(), full) };

        result.structure = await readStructure(page);
        if (axePath) result.axe = await runAxe(page, axePath);
        if (opts.targets && width < 768) result.targets = await measureTargets(page);
        if (opts.keyboard && width === widest) {
          let focusDir = null;
          if (opts.focusShots) {
            focusDir = path.join(outDir, 'focus');
            fs.mkdirSync(focusDir, { recursive: true });
          }
          result.keyboard = await keyboardWalk(page, opts.tabs, focusDir);
        }
      } catch (err) {
        result.ok = false;
        result.error = err.message;
      } finally {
        result.console_errors = consoleErrors.slice(0, 20);
        await page.close().catch(() => {});
      }

      const detailFile = path.join(outDir, `inspect-${width}.json`);
      fs.writeFileSync(detailFile, JSON.stringify(result, null, 2));

      summary.widths.push({
        width,
        ok: result.ok,
        ...(result.error ? { error: result.error } : {}),
        details: path.relative(process.cwd(), detailFile),
        screenshots: result.screenshots,
        axe: result.axe ? {
          violations: result.axe.violations.map((v) => `${v.id} (${v.impact}, ${v.node_count})`),
          needs_review: result.axe.needs_review.map((v) => `${v.id} (${v.node_count})`),
        } : undefined,
        targets: result.targets ? {
          below_44px: result.targets.below_44px,
          failing_wcag_2_5_8: result.targets.failing_wcag_2_5_8,
        } : undefined,
        keyboard: result.keyboard ? {
          stops: result.keyboard.stops_recorded,
          no_visible_focus_change: result.keyboard.no_visible_focus_change,
          obscured_focus: result.keyboard.obscured_focus,
          unnamed_stops: result.keyboard.unnamed_stops,
        } : undefined,
        horizontal_overflow: result.structure ? result.structure.horizontal_overflow : undefined,
        console_errors: result.console_errors.length,
      });
    }
  } finally {
    await browser.close().catch(() => {});
  }

  console.log(JSON.stringify(summary, null, 2));
  if (summary.widths.every((w) => !w.ok)) process.exit(1);
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }));
  process.exit(1);
});
