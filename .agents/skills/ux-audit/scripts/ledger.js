/**
 * Findings ledger helper for the ux-audit skill.
 *
 * The ledger (.ux-audit/findings.json) is the source of truth for finding IDs and
 * statuses across runs. Reports are generated from it; it is never rebuilt from reports
 * except by `migrate` (one-time upgrade from v2.0 reports).
 *
 * Usage (run from the audited project's root):
 *   node ledger.js list [--flow <slug>] [--status open|resolved|wont-fix|false-positive|all]
 *   node ledger.js allocate <CAT>          Reserve and print the next ID for a category (e.g. FORM-03)
 *   node ledger.js validate                Check structure, unique IDs, and counters
 *   node ledger.js migrate                 Build a ledger from existing .ux-audit/reports/*.md
 *   Options: --file <path>  (default .ux-audit/findings.json)
 *
 * The agent adds and updates findings by editing the JSON directly (see
 * references/findings-ledger.md), then runs `validate`.
 */

const fs = require('fs');
const path = require('path');

const STATUSES = ['open', 'resolved', 'wont-fix', 'false-positive'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const CONFIDENCES = ['observed', 'code-confirmed'];
const ID_RE = /^([A-Z0-9]+)-(\d{2,})$/;

function parseArgs(argv) {
  const opts = { file: path.join('.ux-audit', 'findings.json'), cmd: argv[0], args: [] };
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--file') opts.file = argv[++i];
    else if (argv[i] === '--flow') opts.flow = argv[++i];
    else if (argv[i] === '--status') opts.status = argv[++i];
    else opts.args.push(argv[i]);
  }
  return opts;
}

function emptyLedger() {
  return { schema_version: 1, counters: {}, findings: [] };
}

function load(file, { allowMissing = false } = {}) {
  if (!fs.existsSync(file)) {
    if (allowMissing) return emptyLedger();
    fail(`No ledger at ${file}. Run "migrate" if prior reports exist, or start with an empty ledger.`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function save(file, ledger) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(ledger, null, 2) + '\n');
}

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function slugify(s) {
  return s.toLowerCase().replace(/[`'"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// ---------- Commands ----------

function list(opts) {
  const ledger = load(opts.file);
  const status = opts.status || 'open';
  const rows = ledger.findings
    .filter((f) => status === 'all' || f.status === status)
    .filter((f) => !opts.flow || (f.flows || []).includes(opts.flow))
    .map((f) => ({
      id: f.id,
      status: f.status,
      severity: f.severity,
      rule: f.rule,
      file: f.location && f.location.file,
      anchor: f.location && f.location.anchor,
      title: f.title,
      first_flagged: f.first_flagged,
      last_seen: f.last_seen,
      ...(f.status_note ? { note: f.status_note } : {}),
    }));
  console.log(JSON.stringify({ count: rows.length, findings: rows }, null, 2));
}

function allocate(opts) {
  const cat = (opts.args[0] || '').toUpperCase();
  if (!/^[A-Z0-9]+$/.test(cat)) fail('Usage: node ledger.js allocate <CATEGORY>, e.g. allocate FORM');
  const ledger = load(opts.file, { allowMissing: true });
  const used = ledger.findings
    .map((f) => f.id.match(ID_RE))
    .filter((m) => m && m[1] === cat)
    .map((m) => parseInt(m[2], 10));
  const next = Math.max(ledger.counters[cat] || 0, ...used, 0) + 1;
  ledger.counters[cat] = next;
  save(opts.file, ledger);
  console.log(`${cat}-${pad(next)}`);
}

function validate(opts) {
  const ledger = load(opts.file);
  const errors = [];
  const warnings = [];
  if (ledger.schema_version !== 1) errors.push('schema_version must be 1');
  if (!ledger.counters || typeof ledger.counters !== 'object') errors.push('counters must be an object');
  if (!Array.isArray(ledger.findings)) errors.push('findings must be an array');

  const ids = new Set();
  const fingerprints = new Map();
  for (const f of ledger.findings || []) {
    const where = f.id || '(missing id)';
    const m = (f.id || '').match(ID_RE);
    if (!m) errors.push(`${where}: id must look like CAT-01`);
    if (ids.has(f.id)) errors.push(`${where}: duplicate id`);
    ids.add(f.id);
    if (m && f.category !== m[1]) errors.push(`${where}: category "${f.category}" does not match id prefix`);
    if (m && (ledger.counters[m[1]] || 0) < parseInt(m[2], 10)) errors.push(`${where}: counters.${m[1]} is lower than this id`);
    if (!f.rule || !/^[a-z0-9-]+$/.test(f.rule)) errors.push(`${where}: rule must be a kebab-case slug`);
    if (!f.title) errors.push(`${where}: missing title`);
    if (!STATUSES.includes(f.status)) errors.push(`${where}: status must be one of ${STATUSES.join(', ')}`);
    if (!SEVERITIES.includes(f.severity)) errors.push(`${where}: severity must be one of ${SEVERITIES.join(', ')}`);
    if (f.confidence && !CONFIDENCES.includes(f.confidence)) errors.push(`${where}: confidence must be one of ${CONFIDENCES.join(', ')} (needs-verification items stay out of the ledger)`);
    if (!f.location || !f.location.file) errors.push(`${where}: location.file is required`);
    if (!Array.isArray(f.flows) || f.flows.length === 0) errors.push(`${where}: flows must list at least one flow slug`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.first_flagged || '')) errors.push(`${where}: first_flagged must be YYYY-MM-DD`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.last_seen || '')) errors.push(`${where}: last_seen must be YYYY-MM-DD`);
    if (f.status === 'resolved' && !f.resolved_on) errors.push(`${where}: resolved findings need resolved_on`);
    if ((f.status === 'wont-fix' || f.status === 'false-positive') && !f.status_note) {
      warnings.push(`${where}: ${f.status} without status_note; record why so future runs respect it`);
    }
    if (!Array.isArray(f.history) || f.history.length === 0) warnings.push(`${where}: empty history`);
    const fp = `${f.category}|${f.location && f.location.file}|${f.rule}`;
    if (fingerprints.has(fp) && f.status === 'open' && fingerprints.get(fp).status === 'open') {
      warnings.push(`${where}: same category, file, and rule as ${fingerprints.get(fp).id}; likely a duplicate`);
    }
    fingerprints.set(fp, f);
  }

  const summary = {};
  for (const s of STATUSES) summary[s] = (ledger.findings || []).filter((f) => f.status === s).length;
  const ok = errors.length === 0;
  console.log(JSON.stringify({ ok, summary, errors, warnings }, null, 2));
  if (!ok) process.exit(1);
}

// Builds a ledger from v2.0+ reports. Uses the latest report per flow; IDs that collide
// across flows are reassigned and the original kept as legacy_id.
function migrate(opts) {
  if (fs.existsSync(opts.file)) fail(`${opts.file} already exists; migrate only creates a new ledger.`);
  const dir = path.join(path.dirname(opts.file), 'reports');
  if (!fs.existsSync(dir)) fail(`No reports directory at ${dir}`);

  const latestByFlow = new Map();
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
    const m = name.match(/^(\d{4}-\d{2}-\d{2})-(.+?)(?:-\d+)?\.md$/);
    if (m) latestByFlow.set(m[2], { date: m[1], flow: m[2], file: path.join(dir, name) });
  }

  const ledger = emptyLedger();
  const severityMap = { critical: 'critical', high: 'high', major: 'high', medium: 'medium', moderate: 'medium', low: 'low', minor: 'low' };

  for (const { date, flow, file } of latestByFlow.values()) {
    const text = fs.readFileSync(file, 'utf8');
    const blocks = text.split(/\n(?=#{3,4} `\[[A-Z0-9]+-\d+\]`)/);
    for (const block of blocks) {
      const head = block.match(/^#{3,4} `\[([A-Z0-9]+)-(\d+)\]` (.+)$/m);
      if (!head) continue;
      const [, cat, num, title] = head;
      const sev = (block.match(/\*\*Severity\*\*:\s*\S+\s*\**(\w+)/) || [])[1];
      const loc = block.match(/\*\*Location\*\*:\s*\[`?([^\]`]+?)`?\]\(([^)]+)\)/);
      const first = (block.match(/\*\*First [Ff]lagged\*\*:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];

      let file2 = null;
      let line = null;
      if (loc) {
        const target = loc[2].replace(/^file:\/\/\/?/, '').replace(/^(\.\.\/)+/, '');
        const lm = target.match(/#L(\d+)/);
        line = lm ? parseInt(lm[1], 10) : null;
        file2 = target.replace(/#.*$/, '');
      }

      let id = `${cat}-${pad(parseInt(num, 10))}`;
      let legacy = null;
      if (ledger.findings.some((f) => f.id === id)) {
        legacy = id;
        const next = (ledger.counters[cat] || 0) + 1;
        id = `${cat}-${pad(next)}`;
      }
      const n = parseInt(id.split('-')[1], 10);
      ledger.counters[cat] = Math.max(ledger.counters[cat] || 0, n);

      ledger.findings.push({
        id,
        ...(legacy ? { legacy_id: legacy } : {}),
        category: cat,
        rule: slugify(title),
        title: title.trim(),
        flows: [flow],
        location: { file: file2 || 'unknown', line, anchor: null },
        severity: severityMap[(sev || '').toLowerCase()] || 'medium',
        confidence: 'code-confirmed',
        effort: null,
        status: 'open',
        first_flagged: first || date,
        last_seen: date,
        resolved_on: null,
        status_note: null,
        history: [{ date, report: path.relative(path.dirname(opts.file), file).split(path.sep).join('/'), event: 'migrated' }],
      });
    }
  }

  save(opts.file, ledger);
  console.log(JSON.stringify({
    ok: true,
    flows: [...latestByFlow.keys()],
    findings: ledger.findings.length,
    note: 'Review the generated rule slugs and anchors before the next run; severities from v2.0 reports were mapped Major→high, Minor→low.',
  }, null, 2));
}

const opts = parseArgs(process.argv.slice(2));
const commands = { list, allocate, validate, migrate };
if (!commands[opts.cmd]) {
  fail('Usage: node ledger.js <list|allocate|validate|migrate> [--file .ux-audit/findings.json] [--flow slug] [--status open|all|...]');
}
commands[opts.cmd](opts);
