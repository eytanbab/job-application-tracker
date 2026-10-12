# Changelog

All notable changes to the `ux-audit` skill are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-10-12

### Added
- **Six audit passes** (`references/methods.md`): task walkthrough per persona (cognitive-walkthrough questions), state inventory, heuristic sweep, WCAG 2.2 AA conformance checklist, visual craft review (including generic/template-look signals), and content review.
- **New categories**: `[MOTION]` Motion & Animation, `[I18N]` Localization & Content Resilience, `[ETHIC]` Dark Patterns & Ethical Design (22 categories total). PLAT now covers reflow (SC 1.4.10) and orientation (SC 1.3.4).
- **Native mobile** (`references/native-mobile.md`): Apple HIG / Material 3 conventions and code signals for React Native, Flutter, SwiftUI, and Jetpack Compose. `token_inventory.js` now scans `.dart`, `.swift`, and `.kt` files and flags disabled text scaling.
- **`scripts/inspect_page.js`**: rendered-page inspection with axe-core (WCAG 2.0–2.2 A/AA + best practices), a keyboard Tab walk (visible focus change, obscured focus, unnamed stops, optional focus crops), touch-target measurement against SC 2.5.8 with the spacing and inline-link exceptions, heading/landmark structure, horizontal-overflow detection, console errors, dark-mode and reduced-motion emulation, and signed-in pages via storage state.
- **Findings ledger** (`references/findings-ledger.md`, `scripts/ledger.js`): `.ux-audit/findings.json` with project-wide stable IDs, matching rules, statuses (open, resolved, won't-fix, false-positive), regressions, suppression of dismissed findings, and one-time migration from earlier reports.
- **Report**: optional Walkthrough appendix, Rendered checks and Suppressed lines in Method & Evidence, and a Regressed label.

### Changed
- **Interactive mode** reference rewritten as `references/interactive-mode.md` (was `screenshot-capture.md`), with a results-to-findings mapping table and exploratory checks.
- **`capture_screenshots.js`**: loads Playwright from the audited project (fixes failure when the skill is installed globally), waits for network idle and fonts, saves a first-screen shot alongside the full page, uses device-appropriate viewport heights, and supports `--color-scheme` and `--storage-state`.
- **Workflow**: Step 4 runs the six passes; Step 6 reconciles with the ledger; file enumeration includes the layouts wrapping a route.
- **Scorecard mapping**: MOTION → Visual design & craft, I18N → Content & clarity, ETHIC → Feedback & trust.
- **`token_inventory.js`** skips `.claude/` and `.agents/` so installed skills aren't audited.
- **README**: guidance on what to commit and what to ignore.

---

## [2.1.0] - 2026-10-12

### Added
- **Design-lead report layer**: verdict, 6-dimension scorecard with a findings-based rubric, "What's Working", top priorities, root-cause themes, and a Now / Next / Later roadmap.
- **`references/severity.md`**: 4-level severity (🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low) derived from *Impact × Reach*, plus Confidence, Effort, derived Priority, 14 calibration examples, a "not a finding" list, and common miscalibrations.
- **`references/false-positives.md`**: verification protocol, plus what common libraries (Radix/shadcn, Headless UI, React Aria, MUI, Chakra, Angular Material, react-hook-form, Next.js) and native HTML already handle, and frequently missed WCAG exceptions.
- **`scripts/contrast.js`**: WCAG contrast calculator supporting hex, rgb, hsl, oklch, bare shadcn HSL channels, alpha compositing, and `tw:<color>-<shade>` lookup from the project's Tailwind install.
- **`scripts/token_inventory.js`**: design-token drift inventory (colors, palettes, type sizes/weights/families, radii, shadows, z-index, breakpoints, arbitrary values, off-grid spacing, inline styles, icon libraries) with file:line evidence.
- **Finding fields**: Confidence with evidence, Priority, Theme, Severity reasoning, and Acceptance criteria. Recommendations can be a diff, a copy rewrite table, or a design spec.
- **Report sections**: "To Verify" (uncertain items, excluded from totals) and "Coverage" (honest per-category status).

### Changed
- **Workflow**: new "Measure Before Judging" and "Verify & Rate" steps; synthesis (themes → scorecard → priorities → verdict) runs before writing.
- **Example**: rewritten as an internally consistent gold-standard report with calibrated severities, mixed fix formats, and documented "Checked & cleared" items.
- **Report links**: relative to the report file instead of `file:///` URLs.
- **categories.md accuracy**: WCAG 2.2 references; correct large-text definition (24px / 18.66px bold); target size per SC 2.5.8 vs. platform guidance; Hick's Law no longer conflated with Miller's 7±2; undo preferred over confirmation dialogs; "reward early, punish late" validation timing; iOS input zoom rule.

### Removed
- The 19-column Sweep Verification Matrix (replaced by the Coverage table).

---

## [2.0.0] - 2026-08-22

### Added
- **Design Review Mode**: Direct audit capability for Figma URLs, screenshots, and visual mockups.
- **Import-Tree File Enumeration**: Explicit step to recursively trace components, subviews, and UI primitives.
- **Framework-Agnostic Code Signals**: Multi-framework inspection patterns in `categories.md` for React, Vue, Svelte, Angular, and HTML/CSS.
- **Configurable Settle Delay**: Added settle delay parameter to `capture_screenshots.js` for SPA hydration and animation rendering.
- **`tech_stack` Context Storage**: Automated detection and persistence of UI frameworks and CSS libraries in `.ux-audit/context.json`.
- **Sweep Verification Matrix**: Structured table in reports verifying every file against all 19 categories.
- **Deterministic Issue IDs**: Standardized `[CAT-XX]` keys for regression tracking across runs.
- **Effort vs. Severity Decoupling**: Distinct `Effort / Impact` ratings and code diff snippets for every finding.

### Changed
- **Auto-Detect & Confirm Protocol**: Replaced multi-turn intake interrogation with autonomous repository inspection and 1-click confirmation.
- **Report Template Alignment**: Standardized heading hierarchy (`### Group:` -> `#### [CAT-XX]`) across New and Recurring findings.
- **Harden Screenshot Script**: Dynamic Playwright imports and graceful JSON error handling.
- **Standardized Directory Layout**: Walkthroughs placed under `examples/example-run.md`.

### Removed
- Deprecated unstructured `EXAMPLE.md` in skill root.
- Removed restrictive `additionalProperties: false` from `context.json` schema.
