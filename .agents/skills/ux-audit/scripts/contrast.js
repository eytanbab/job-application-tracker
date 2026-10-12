/**
 * WCAG contrast calculator for the ux-audit skill.
 *
 * Never estimate contrast by eye: resolve the actual foreground/background values
 * (design tokens, CSS variables, Tailwind classes) and run them through this script.
 *
 * Usage:
 *   node contrast.js <fg> <bg> [<fg> <bg> ...] [--size <px>] [--weight <n>] [--canvas <color>]
 *   node contrast.js --pairs pairs.json
 *
 * Supported color formats:
 *   #rgb #rgba #rrggbb #rrggbbaa | rgb()/rgba() | hsl()/hsla() | oklch()
 *   bare HSL channels as used in shadcn/ui CSS variables: "222.2 84% 4.9%"
 *   white | black | transparent
 *   tw:<family>-<shade> (e.g. tw:gray-400) resolved from the project's installed tailwindcss
 *
 * pairs.json format:
 *   [{ "label": "Helper text", "fg": "tw:gray-400", "bg": "#ffffff", "size": 14, "weight": 400 }]
 *
 * Semi-transparent foregrounds are composited over the background; semi-transparent
 * backgrounds are composited over --canvas (default white).
 *
 * Output: JSON array, one entry per pair. Pass/fail uses the unrounded ratio
 * (WCAG does not allow rounding 4.49 up to 4.5).
 */

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

// ---------- Parsing ----------

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function parseAlpha(a) {
  if (a === undefined || a === null || a === '') return 1;
  const s = String(a).trim();
  return clamp01(s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s));
}

function parseHex(s) {
  let h = s.slice(1);
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
}

// Splits "a, b, c / d" or "a b c / d" into channels + alpha.
function splitArgs(inner) {
  const [main, slashAlpha] = inner.split('/');
  const parts = main.trim().split(/[\s,]+/).filter(Boolean);
  const alpha = slashAlpha !== undefined ? slashAlpha.trim() : parts[3];
  return { parts: parts.slice(0, 3), alpha };
}

function parseRgbChannel(s) {
  return s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s) / 255;
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}

function parseHue(s) {
  if (s.endsWith('turn')) return parseFloat(s) * 360;
  if (s.endsWith('rad')) return (parseFloat(s) * 180) / Math.PI;
  return parseFloat(s);
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const lin = {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
  // Simple gamut clip; good enough for contrast purposes.
  return {
    r: clamp01(linearToSrgb(clamp01(lin.r))),
    g: clamp01(linearToSrgb(clamp01(lin.g))),
    b: clamp01(linearToSrgb(clamp01(lin.b))),
  };
}

function resolveTailwind(token) {
  const name = token.slice(3).trim(); // after "tw:"
  const [family, shade] = name.split(/-(?=\d+$)/);
  const projectRequire = createRequire(path.join(process.cwd(), 'package.json'));

  try {
    const mod = projectRequire('tailwindcss/colors');
    const colors = mod.default || mod;
    const value = shade ? colors[family] && colors[family][shade] : colors[family];
    if (typeof value === 'string') return value;
  } catch {
    // fall through to theme.css lookup (Tailwind v4)
  }

  try {
    const pkgDir = path.dirname(projectRequire.resolve('tailwindcss/package.json'));
    const css = fs.readFileSync(path.join(pkgDir, 'theme.css'), 'utf8');
    const m = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
    if (m) return m[1].trim();
  } catch {
    // not available
  }

  throw new Error(
    `Could not resolve "${token}" from the project's tailwindcss package. ` +
    'Run from the project root, or pass the literal color value instead.'
  );
}

function parseColor(input) {
  let s = String(input).trim().toLowerCase();
  if (s.startsWith('tw:')) s = resolveTailwind(s).toLowerCase();

  if (s === 'white') return { r: 1, g: 1, b: 1, a: 1 };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (/^#[0-9a-f]{3,8}$/.test(s)) {
    const c = parseHex(s);
    if (c) return c;
  }

  const fn = s.match(/^(rgba?|hsla?|oklch)\((.*)\)$/);
  if (fn) {
    const { parts, alpha } = splitArgs(fn[2]);
    if (parts.length < 3) throw new Error(`Cannot parse color "${input}"`);
    const a = parseAlpha(alpha);
    if (fn[1].startsWith('rgb')) {
      return { r: parseRgbChannel(parts[0]), g: parseRgbChannel(parts[1]), b: parseRgbChannel(parts[2]), a };
    }
    if (fn[1].startsWith('hsl')) {
      return { ...hslToRgb(parseHue(parts[0]), parseFloat(parts[1]) / 100, parseFloat(parts[2]) / 100), a };
    }
    const L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
    const C = parts[1].endsWith('%') ? (parseFloat(parts[1]) / 100) * 0.4 : parseFloat(parts[1]);
    return { ...oklchToRgb(L, C, parts[2] === 'none' ? 0 : parseHue(parts[2])), a };
  }

  // Bare HSL channels, e.g. shadcn/ui: "--muted-foreground: 215.4 16.3% 46.9%;"
  const bare = s.match(/^([\d.]+)(?:deg)?\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+%?))?$/);
  if (bare) {
    return { ...hslToRgb(parseFloat(bare[1]), parseFloat(bare[2]) / 100, parseFloat(bare[3]) / 100), a: parseAlpha(bare[4]) };
  }

  throw new Error(`Unsupported color format "${input}"`);
}

// ---------- Math ----------

function composite(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

function luminance({ r, g, b }) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function toHex({ r, g, b }) {
  const h = (c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

// WCAG: large text is >= 18pt (24px) regular, or >= 14pt (~18.66px) bold (700+).
function isLargeText(sizePx, weight) {
  if (!sizePx) return null;
  return sizePx >= 24 || (sizePx >= 18.66 && (weight || 400) >= 700);
}

function evaluate({ label, fg, bg, size, weight }, canvas) {
  const canvasColor = parseColor(canvas);
  const bgParsed = parseColor(bg);
  const bgSolid = bgParsed.a < 1 ? composite(bgParsed, canvasColor) : bgParsed;
  const fgParsed = parseColor(fg);
  const fgSolid = fgParsed.a < 1 ? composite(fgParsed, bgSolid) : fgParsed;

  const l1 = luminance(fgSolid);
  const l2 = luminance(bgSolid);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  const result = {
    ...(label ? { label } : {}),
    fg,
    bg,
    fg_resolved: toHex(fgSolid),
    bg_resolved: toHex(bgSolid),
    ratio: Math.floor(ratio * 100) / 100,
    aa_normal_text: ratio >= 4.5,
    aa_large_text: ratio >= 3,
    aaa_normal_text: ratio >= 7,
    aaa_large_text: ratio >= 4.5,
    non_text_ui_3to1: ratio >= 3,
  };

  const large = isLargeText(size, weight);
  if (large !== null) {
    result.text = { size_px: size, weight: weight || 400, large_text: large };
    result.required_aa = large ? 3 : 4.5;
    result.passes_aa = ratio >= result.required_aa;
  }
  return result;
}

// ---------- CLI ----------

function main() {
  const args = process.argv.slice(2);
  const opts = { canvas: '#ffffff' };
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--size') opts.size = parseFloat(args[++i]);
    else if (a === '--weight') opts.weight = parseInt(args[++i], 10);
    else if (a === '--canvas') opts.canvas = args[++i];
    else if (a === '--pairs') opts.pairsFile = args[++i];
    else positional.push(a);
  }

  let pairs = [];
  if (opts.pairsFile) {
    pairs = JSON.parse(fs.readFileSync(opts.pairsFile, 'utf8'));
  } else {
    if (positional.length < 2 || positional.length % 2 !== 0) {
      console.error(JSON.stringify({
        ok: false,
        error: 'Usage: node contrast.js <fg> <bg> [<fg> <bg> ...] [--size px] [--weight n] [--canvas color] | --pairs pairs.json',
      }, null, 2));
      process.exit(1);
    }
    for (let i = 0; i < positional.length; i += 2) {
      pairs.push({ fg: positional[i], bg: positional[i + 1], size: opts.size, weight: opts.weight });
    }
  }

  const results = pairs.map((p) => {
    try {
      return evaluate(p, p.canvas || opts.canvas);
    } catch (err) {
      return { ...(p.label ? { label: p.label } : {}), fg: p.fg, bg: p.bg, ok: false, error: err.message };
    }
  });

  console.log(JSON.stringify(results, null, 2));
  if (results.every((r) => r.ok === false)) process.exit(1);
}

main();
