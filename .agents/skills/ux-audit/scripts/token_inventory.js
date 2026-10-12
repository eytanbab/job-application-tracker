/**
 * Design-token inventory for the ux-audit skill.
 *
 * Counts the distinct visual values a codebase actually uses (colors, type sizes,
 * weights, families, radii, shadows, spacing, z-index, breakpoints, icon libraries)
 * so design-system drift can be reported with objective evidence instead of impressions.
 *
 * Scans web (CSS/SCSS, JS/TS, JSX/TSX, Vue, Svelte, Astro, HTML) and native code
 * (Dart/Flutter, Swift/SwiftUI, Kotlin/Compose), and flags disabled text scaling.
 *
 * Read-only. Skips dependencies, build output, tests, and stories.
 *
 * Usage:
 *   node token_inventory.js [path ...] [--top <n>] [--examples <n>]
 *
 *   path        Files or directories to scan (default: current directory). Pass the
 *               in-scope files/directories of the audited flow for a flow-level view,
 *               or the source root for a whole-product view.
 *   --top       Max values listed per category (default 12).
 *   --examples  Max file:line locations listed per value (default 3).
 *
 * Output: JSON with `summary` (distinct counts), `signals` (things worth investigating —
 * NOT findings until verified), and `details` (top values with locations).
 * All extraction is regex-based and heuristic: open the cited locations before
 * using a value as evidence in a report.
 */

const fs = require('fs');
const path = require('path');

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt', '.svelte-kit', '.output',
  'coverage', '.turbo', '.vercel', '.cache', '.ux-audit', 'storybook-static', 'vendor',
  '.expo', 'Pods', '.idea', '.vscode', '.gradle', '.dart_tool', 'DerivedData', '.build',
  '.claude', '.agents', // installed agent skills
]);
const EXTENSIONS = new Set([
  '.css', '.scss', '.sass', '.less', '.pcss', '.styl',
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
  '.vue', '.svelte', '.astro', '.html', '.htm',
  '.dart', '.swift', '.kt', // Flutter, SwiftUI/UIKit, Jetpack Compose
]);
const STYLE_EXTENSIONS = new Set(['.css', '.scss', '.sass', '.less', '.pcss', '.styl']);
const SKIP_FILE = /\.(min\.(css|js)|test\.[jt]sx?|spec\.[jt]sx?|stories\.[jt]sx?|stories\.mdx|d\.ts)$/;
const MAX_FILE_BYTES = 1024 * 1024;

const HUES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const NEUTRALS = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone']);
const COLOR_UTILS = 'bg|text|border(?:-[trblxyse])?|ring|ring-offset|fill|stroke|outline|from|via|to|decoration|divide|accent|caret|placeholder|shadow';
const SEMANTIC_TOKENS = 'primary|secondary|muted|accent|destructive|foreground|background|card|popover|border|input|ring|success|warning|danger|info|error|surface|brand';

// Each matcher: { cat, re, value(match) -> string|null, styleOnly? }
const MATCHERS = [
  // ---- Colors
  {
    cat: 'colors',
    re: /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g,
    value: (m, line, ext) => {
      const before = line.slice(Math.max(0, m.index - 24), m.index);
      if (/(href|to|id|for|querySelector(All)?\(|getElementById\(|url\()\s*=?\s*\{?\s*["'`]?$/.test(before)) return null;
      // CSS id selectors: match occurs before the opening brace of a rule
      if (STYLE_EXTENSIONS.has(ext) && line.includes('{') && m.index < line.indexOf('{')) return null;
      return normalizeHex(m[0]);
    },
  },
  {
    cat: 'colors',
    re: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*[^()]*?\)/g,
    value: (m) => m[0].toLowerCase().replace(/\s+/g, ' '),
  },
  {
    cat: 'tailwind_palette_colors',
    re: new RegExp(`(?<![\\w-])(?:${COLOR_UTILS})-(${HUES})-(50|100|200|300|400|500|600|700|800|900|950)(?:\\/\\d+)?(?![\\w-])`, 'g'),
    value: (m) => `${m[1]}-${m[2]}`,
  },
  {
    cat: 'tailwind_semantic_colors',
    re: new RegExp(`(?<![\\w-])(?:${COLOR_UTILS})-((?:${SEMANTIC_TOKENS})(?:-foreground)?)(?:\\/\\d+)?(?![\\w-])`, 'g'),
    value: (m) => m[1],
  },

  // Flutter / Compose: Color(0xAARRGGBB)
  {
    cat: 'colors',
    re: /\bColor\(\s*0x([0-9a-fA-F]{8})\s*\)/g,
    value: (m) => {
      const h = m[1].toLowerCase();
      return h.startsWith('ff') ? `#${h.slice(2)}` : `#${h.slice(2)}${h.slice(0, 2)}`;
    },
  },
  // SwiftUI: Color(red: 0.2, green: 0.4, blue: 0.6)
  {
    cat: 'colors',
    re: /\bColor\(\s*red:\s*[\d./ ]+,\s*green:\s*[\d./ ]+,\s*blue:\s*[\d./ ]+(?:,\s*opacity:\s*[\d.]+)?\s*\)/g,
    value: (m) => m[0].replace(/\s+/g, ' '),
  },

  // ---- Typography
  { cat: 'font_sizes', re: /\.system\(\s*size:\s*([\d.]+)/g, value: (m) => `${m[1]}pt (fixed, ignores Dynamic Type)` },
  { cat: 'font_sizes', re: /\bfontSize\s*=\s*([\d.]+)\.(sp|dp)\b/g, value: (m) => `${m[1]}.${m[2]}` },
  {
    cat: 'text_scaling_disabled',
    re: /allowFontScaling\s*=\s*\{\s*false\s*\}|allowFontScaling\s*:\s*false|TextScaler\.noScaling|textScaleFactor\s*:\s*1(?:\.0)?\b|\bfontSize\s*=\s*[\d.]+\.dp\b/g,
    value: (m) => m[0].replace(/\s+/g, ' '),
  },
  { cat: 'font_sizes', re: /font-size\s*:\s*([^;}"'\n]+)/g, value: (m) => m[1].trim() },
  { cat: 'font_sizes', re: /\bfontSize\s*:\s*['"]?([\d.]+(?:px|rem|em|pt)?)/g, value: (m) => m[1] },
  {
    cat: 'font_sizes',
    re: /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl|\[(?:length:)?[\d.]+(?:px|rem|em|pt)\])(?![\w-])/g,
    value: (m) => `text-${m[1]}`,
  },
  { cat: 'font_weights', re: /font-weight\s*:\s*([\w-]+)/g, value: (m) => m[1] },
  { cat: 'font_weights', re: /\bfontWeight\s*:\s*['"]?(\w+)/g, value: (m) => m[1] },
  {
    cat: 'font_weights',
    re: /(?<![\w-])font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])(?![\w-])/g,
    value: (m) => `font-${m[1]}`,
  },
  {
    cat: 'font_families',
    re: /font-family\s*:\s*([^;}\n]+)/g,
    value: (m) => m[1].split(',')[0].trim().replace(/["']/g, ''),
  },
  { cat: 'font_families', re: /\bfontFamily\s*:\s*['"]([^'",]+)/g, value: (m) => m[1].trim() },
  { cat: 'font_families', re: /(?<![\w-])font-(sans|serif|mono|\[[^\]]+\])(?![\w-])/g, value: (m) => `font-${m[1]}` },

  // ---- Shape & elevation
  { cat: 'radii', re: /border-radius\s*:\s*([^;}\n]+)/g, value: (m) => m[1].trim() },
  { cat: 'radii', re: /\bborderRadius\s*:\s*['"]?([\d.]+(?:px|rem|em|%)?)/g, value: (m) => m[1] },
  {
    cat: 'radii',
    re: /(?<![\w-])rounded(?:-(?:t|r|b|l|tl|tr|br|bl|s|e|ss|se|es|ee))?(?:-(none|xs|sm|md|lg|xl|2xl|3xl|4xl|full|\[[^\]]+\]))?(?![\w-])/g,
    value: (m) => `rounded-${m[1] || 'DEFAULT'}`,
  },
  { cat: 'shadows', re: /box-shadow\s*:\s*([^;}\n]+)/g, value: (m) => m[1].trim().replace(/\s+/g, ' ') },
  {
    cat: 'shadows',
    re: /(?<![\w-])shadow(?:-(2xs|xs|sm|md|lg|xl|2xl|inner|none|\[[^\]]+\]))?(?![\w-])/g,
    value: (m) => `shadow-${m[1] || 'DEFAULT'}`,
  },
  { cat: 'radii', re: /BorderRadius\.circular\(\s*([\d.]+)/g, value: (m) => `${m[1]} (Flutter)` },
  { cat: 'radii', re: /RoundedCornerShape\(\s*([\d.]+)\.dp/g, value: (m) => `${m[1]}.dp` },
  { cat: 'radii', re: /cornerRadius\s*(?::|\()\s*([\d.]+)/g, value: (m) => `${m[1]}pt` },
  { cat: 'z_index', re: /z-index\s*:\s*(-?\d+)/g, value: (m) => m[1] },
  { cat: 'z_index', re: /\bzIndex\s*:\s*(-?\d+)/g, value: (m) => m[1] },
  { cat: 'z_index', re: /(?<![\w-])-?z-(\d+|\[[^\]]+\])(?![\w-])/g, value: (m) => `z-${m[1]}` },

  // ---- Spacing
  {
    cat: 'tailwind_arbitrary_values',
    // Trailing (?![\w:-]) excludes variants such as data-[state=open]: and group-[.is-active]:
    re: /(?<![\w-])(?:[a-z]+(?:-[a-z]+)*)-\[(?!&)[^\]\s]+\](?![\w:-])/g,
    value: (m) => m[0],
  },
  {
    cat: 'css_spacing_px',
    re: /(?:padding|margin|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?\s*:\s*([^;}\n]+)/g,
    value: (m) => m[1].trim(),
  },

  // ---- Layout
  { cat: 'breakpoints', re: /@media[^{]*?\((?:min|max)-width\s*:\s*([\d.]+(?:px|em|rem))/g, value: (m) => m[1] },
  { cat: 'inline_styles', re: /\bstyle=\{\{|\bstyle="|:style="/g, value: () => 'inline style' },

  // ---- Icons
  {
    cat: 'icon_libraries',
    re: /(?:from\s+|require\(\s*|import\s+)['"]((?:lucide-react|lucide-vue-next|lucide-svelte|@lucide\/[\w-]+|@heroicons\/[\w/-]+|react-icons\/\w+|@fortawesome\/[\w-]+|@mui\/icons-material[\w/-]*|@tabler\/icons[\w-]*|@phosphor-icons\/[\w-]+|phosphor-react|@radix-ui\/react-icons|@iconify[\w/-]*|react-feather|ionicons|@expo\/vector-icons[\w/-]*|react-native-vector-icons[\w/-]*|bootstrap-icons|@material-symbols[\w/-]*))/g,
    value: (m) => normalizeIconLib(m[1]),
  },
];

function normalizeHex(hex) {
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8 && h.endsWith('ff')) h = h.slice(0, 6);
  return `#${h}`;
}

function normalizeIconLib(spec) {
  if (spec.startsWith('react-icons/')) return `react-icons (${spec.split('/')[1]})`;
  if (spec.startsWith('@heroicons/')) return '@heroicons';
  if (spec.startsWith('@fortawesome/')) return '@fortawesome';
  if (spec.startsWith('@mui/icons-material')) return '@mui/icons-material';
  if (spec.startsWith('@tabler/icons')) return '@tabler/icons';
  if (spec.startsWith('@expo/vector-icons')) return '@expo/vector-icons';
  if (spec.startsWith('react-native-vector-icons')) return 'react-native-vector-icons';
  if (spec.startsWith('lucide') || spec.startsWith('@lucide/')) return 'lucide';
  return spec;
}

// ---------- Walking ----------

function collectFiles(target, files) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    for (const entry of fs.readdirSync(target)) collectFiles(path.join(target, entry), files);
  } else if (stat.isFile()) {
    if (!EXTENSIONS.has(path.extname(target)) || SKIP_FILE.test(target) || stat.size > MAX_FILE_BYTES) return;
    files.push(target);
  }
}

// ---------- Main ----------

function main() {
  const args = process.argv.slice(2);
  let top = 12;
  let maxExamples = 3;
  const targets = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--top') top = parseInt(args[++i], 10) || top;
    else if (args[i] === '--examples') maxExamples = parseInt(args[++i], 10) || maxExamples;
    else targets.push(args[i]);
  }
  if (targets.length === 0) targets.push('.');

  const files = [];
  for (const t of targets) collectFiles(path.resolve(t), files);

  // cat -> value -> { count, files:Set, examples:[] }
  const data = {};
  const add = (cat, value, rel, lineNo) => {
    data[cat] = data[cat] || new Map();
    const entry = data[cat].get(value) || { count: 0, files: new Set(), examples: [] };
    entry.count++;
    entry.files.add(rel);
    if (entry.examples.length < maxExamples) entry.examples.push(`${rel}:${lineNo}`);
    data[cat].set(value, entry);
  };

  for (const file of files) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join('/');
    const ext = path.extname(file);
    let text;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (line.length > 2000) return; // minified or generated content
      for (const matcher of MATCHERS) {
        matcher.re.lastIndex = 0;
        let m;
        while ((m = matcher.re.exec(line)) !== null) {
          const v = matcher.value(m, line, ext);
          if (v) add(matcher.cat, v, rel, idx + 1);
          if (m[0].length === 0) matcher.re.lastIndex++;
        }
      }
    });
  }

  // Derived: off-grid spacing (px values not on a 4px grid, ignoring hairlines 0–2px)
  const offGrid = new Map();
  const collectPx = (raw, entry) => {
    for (const px of raw.match(/-?\d*\.?\d+px/g) || []) {
      const n = Math.abs(parseFloat(px));
      if (n > 2 && n % 4 !== 0) {
        const e = offGrid.get(`${n}px`) || { count: 0, files: new Set(), examples: [] };
        e.count += entry.count;
        entry.files.forEach((f) => e.files.add(f));
        for (const ex of entry.examples) if (e.examples.length < maxExamples) e.examples.push(ex);
        offGrid.set(`${n}px`, e);
      }
    }
  };
  for (const [value, entry] of data.css_spacing_px || []) collectPx(value, entry);
  for (const [value, entry] of data.tailwind_arbitrary_values || []) {
    if (/^-?(?:p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y)-\[/.test(value)) {
      collectPx(value, entry);
    }
  }
  if (offGrid.size) data.off_grid_spacing = offGrid;
  delete data.css_spacing_px;

  const distinct = (cat) => (data[cat] ? data[cat].size : 0);
  const total = (cat) => (data[cat] ? [...data[cat].values()].reduce((s, e) => s + e.count, 0) : 0);

  const paletteFamilies = new Set([...(data.tailwind_palette_colors || new Map()).keys()].map((k) => k.split('-')[0]));
  const neutralFamilies = [...paletteFamilies].filter((f) => NEUTRALS.has(f));
  const iconLibs = [...(data.icon_libraries || new Map()).keys()];
  const zValues = [...(data.z_index || new Map()).keys()];
  const fontFamilies = [...(data.font_families || new Map()).keys()].filter((f) => !/^(inherit|var\(|font-(sans|serif|mono)$)/.test(f));

  const summary = {
    files_scanned: files.length,
    distinct_color_literals: distinct('colors'),
    tailwind_palette_colors: distinct('tailwind_palette_colors'),
    tailwind_palette_families: [...paletteFamilies].sort(),
    color_class_usage: {
      semantic_token_classes: total('tailwind_semantic_colors'),
      raw_palette_classes: total('tailwind_palette_colors'),
      color_literals: total('colors'),
    },
    distinct_font_sizes: distinct('font_sizes'),
    distinct_font_weights: distinct('font_weights'),
    distinct_font_families: distinct('font_families'),
    distinct_radii: distinct('radii'),
    distinct_shadows: distinct('shadows'),
    distinct_z_index: distinct('z_index'),
    distinct_breakpoints: distinct('breakpoints'),
    tailwind_arbitrary_values: total('tailwind_arbitrary_values'),
    off_grid_spacing_values: distinct('off_grid_spacing'),
    inline_style_attributes: total('inline_styles'),
    icon_libraries: iconLibs,
    text_scaling_disabled: total('text_scaling_disabled'),
  };

  const signals = [];
  if (neutralFamilies.length > 1) signals.push(`Multiple neutral palettes in use (${neutralFamilies.join(', ')}): grays will not match across screens.`);
  if (iconLibs.length > 1) signals.push(`${iconLibs.length} icon libraries in use (${iconLibs.join(', ')}): check for mismatched stroke weight, size grid, and metaphor.`);
  if (summary.distinct_font_sizes > 10) signals.push(`${summary.distinct_font_sizes} distinct font sizes: a type scale usually needs 6–9 steps.`);
  if (fontFamilies.length > 3) signals.push(`${fontFamilies.length} font families declared: check for unintended fallbacks or one-off fonts.`);
  if (summary.distinct_radii > 6) signals.push(`${summary.distinct_radii} distinct border radii: corner style likely inconsistent across components.`);
  if (summary.distinct_shadows > 6) signals.push(`${summary.distinct_shadows} distinct shadows: elevation levels likely undefined.`);
  if (summary.tailwind_arbitrary_values > 0) signals.push(`${summary.tailwind_arbitrary_values} Tailwind arbitrary values (e.g. p-[13px], bg-[#2563eb]): each bypasses the theme scale.`);
  if (summary.off_grid_spacing_values > 0) signals.push(`${summary.off_grid_spacing_values} spacing values off the 4px grid: spacing rhythm likely inconsistent.`);
  if (zValues.length > 8 || zValues.some((z) => /\d{4,}/.test(z))) signals.push(`z-index values (${zValues.join(', ')}) suggest no layering scale; check for overlap bugs between modals, toasts, and sticky headers.`);
  const cu = summary.color_class_usage;
  if (cu.semantic_token_classes > 0 && cu.raw_palette_classes + cu.color_literals > cu.semantic_token_classes) {
    signals.push(`Semantic color tokens exist but raw palette classes/literals are used more often (${cu.raw_palette_classes + cu.color_literals} vs ${cu.semantic_token_classes}): theming and dark mode will drift.`);
  }
  if (summary.text_scaling_disabled > 0) signals.push(`${summary.text_scaling_disabled} places disable or bypass the user's text-size setting (allowFontScaling=false, TextScaler.noScaling, fontSize in dp): fails users who need larger text.`);
  if (summary.inline_style_attributes > 20) signals.push(`${summary.inline_style_attributes} inline style attributes: styling is bypassing the design system.`);

  const details = {};
  for (const [cat, map] of Object.entries(data)) {
    details[cat] = [...map.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, top)
      .map(([value, e]) => ({ value, count: e.count, files: e.files.size, examples: e.examples }));
  }

  console.log(JSON.stringify({ summary, signals, details }, null, 2));
}

main();
