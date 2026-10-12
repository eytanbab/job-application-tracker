---
name: ux-audit
version: 2.2.0
description: >
  Audit a website, mobile application, design mockup, or web UI from a UX/UI
  standpoint and generate a severity-ranked, actionable report written at the
  level of a senior design lead. Use this skill whenever asked to review a UI,
  audit UX/UI friction, critique a design or flow, verify accessibility (WCAG),
  give feedback on forms, dashboards, and interactive screens, check for dark
  patterns, or explain why a UI "feels off", looks unprofessional, or needs
  polish. Works for web and native mobile (React Native, Flutter, SwiftUI,
  Jetpack Compose). Builds grounded personas
  from repository inspection and lightweight confirmation, persists context in
  .ux-audit/context.json, tracks issue resolutions across runs, and gives each
  finding calibrated severity, confidence, effort, and priority with a concrete
  fix and acceptance criteria. Supports Source-Only, Interactive (Playwright +
  axe-core), and Design Review modes. Do not use for backend API performance tuning,
  database schema optimization, or infrastructure/CI-CD audits.
license: MIT
compatibility: >
  Requires read/write workspace access to save .ux-audit/ context and reports.
  Compatible with Claude Code, Antigravity, and Codex CLI. Bundled analysis
  scripts require Node.js. Interactive mode also requires Playwright (axe-core
  optional) in the audited project; falls back to source-only mode if
  unavailable.
---

# UX/UI Audit Skill

Produces structured UX/UI audits grounded in project-specific user personas, written to the standard of a head of design: a clear verdict, systemic themes, calibrated severity, honest confidence, and fixes a team can act on. Persists context and tracks resolved and recurring issues across runs.

**The bar:** every finding must be real, rated by its effect on users, and fixable from the report alone. Fewer correct findings beat many speculative ones.

---

## Execution Workflow

1. **Step 1: Check Context / Auto-Detect & Confirm** (`.ux-audit/context.json`)
2. **Step 2: Determine Flow & Audit Mode** (Source-Only | Interactive | Design Review)
3. **Step 3: Instantiate Grounded Personas** (2–4 domain personas)
4. **Step 4: Enumerate, Measure & Audit** (file enumeration, measurement scripts, six audit passes)
5. **Step 5: Verify & Rate Every Candidate Finding** (false-positive protocol, severity model)
6. **Step 6: Reconcile With the Findings Ledger** (stable IDs; New, Recurring, Regressed, Resolved)
7. **Step 7: Synthesize, Write Report & Update Context** (`.ux-audit/reports/`)
8. **Step 8: Present Summary & Hand Off to Developer** (Read-only finish)

---

### Step 1: Establish Project Context (Auto-Detect & Confirm)

1. Check for `.ux-audit/context.json` at the workspace root:
   - **If found**: Check that required fields (`product_description`, `audience`, `business_model`, `platform`, `tech_stack`, `last_flow`, `last_updated`) are present and non-empty. Consult [context-schema.md](./references/context-schema.md) for field definitions. Present a 2-line summary to the developer. If `audience_is_generic_fallback: true` or `last_updated` is >90 days old, offer to refresh the context.
   - **If not found**: Execute the **Auto-Detect & Confirm** protocol from [interview.md](./references/interview.md):
     - Scan manifests (`package.json`, etc.), `README.md`, and routing files.
     - Draft initial context, including detected frameworks/libraries in `tech_stack`.
     - Present the drafted context for single-turn confirmation (or use interactive question tools if available).
     - Save confirmed data to `.ux-audit/context.json`.

> [!CAUTION]
> **GUARDRAIL**: Never audit using placeholder personas ("everyone", "all users") without developer confirmation. Grounded personas are required for accurate friction analysis.

---

### Step 2: Scope the Audit Flow & Mode

1. **Select Flow**: Ask which user flow or screen to audit (default to `last_flow` from `context.json` if present).
   - If the requested scope is unconstrained ("the whole app"), advise the user to scope to a specific journey (e.g. checkout, onboarding, dashboard) for deeper rigor.
2. **Select Mode**:
   - **Source-Only (Default)**: Inspect component source, markup, state hooks, and CSS/Tailwind classes. Exclude `node_modules/`, `.git/`, and build artifacts.
   - **Interactive**: If a local server or URL is provided, run `inspect_page.js` (screenshots, axe-core, keyboard walk, touch targets) following [interactive-mode.md](./references/interactive-mode.md). Findings seen or measured in the rendered UI can be rated **Observed**. Combine with source reading to locate the code behind each issue.
   - **Design Review**: If the developer provides image files, screenshots, or design mockups, evaluate visual/layout categories (`HIER`, `TYPO`, `COLOR`, `DSYS`, `COPY`, `AFFORD`, `ETHIC`). Mark dynamic categories (`FORM` validation timing, `STATE` async transitions, `A11Y` keyboard operability, `PERF`, `MOTION`) as *Not evaluable in this mode* in the Coverage table.
   - **Native apps**: If `platform` includes `ios` or `android`, also use [native-mobile.md](./references/native-mobile.md) for platform conventions and code signals. Rendered evidence comes from developer-provided or simulator screenshots.
3. **Privacy & Secrets Guardrail**:
   - Never output API keys, passwords, or tokens found in `.env` or code files into findings or reports.

---

### Step 3: Instantiate Grounded Personas

Construct 2–4 distinct personas derived directly from `context.json` and domain requirements:
- **Role & Primary Goal**: What the user is trying to accomplish in this flow.
- **Context & Constraints**: Time pressure, technical proficiency, device and viewport, environment (noise, glare, interruptions), and abilities (including at least one persona or constraint covering keyboard-only, screen-reader, low-vision, or motor-impaired use).
- **Mental Model**: Expectations based on competitor conventions (Jakob's Law) and `reference_product`.

Every persona must be used: each should be named in at least one finding or explicitly noted in the walkthrough as unaffected.

---

### Step 4: Enumerate, Measure & Sweep

#### 4.1 File Enumeration
Identify all files belonging to the flow before auditing:
1. **Entry Route**: Locate the entry route or page definition in the project router (`app/`, `pages/`, `routes/`, `router.ts`).
2. **Import Tree**: Follow `import` statements recursively from the entry component to collect all child components, subviews, custom hooks, and style modules.
3. **Shared UI Primitives**: Include referenced shared components (e.g. `<Button>`, `<Input>`, `<Modal>`, `<Drawer>`, `<Table>`), plus global styles and theme/token files (`globals.css`, `tailwind.config.*`, theme providers).
4. **Route-level wrappers**: Include the layouts that wrap the route (navigation bars, banners, footers) and its loading, error, and not-found boundaries.
5. **List In-Scope Files**: Record all collected files for the report's "Files Reviewed" appendix.

#### 4.2 Measure Before Judging
Collect objective evidence with the bundled scripts (run from the audited project's root; `<skill-path>` is this skill's directory):

```bash
# Design-token inventory: distinct colors, type sizes, radii, shadows, spacing, icon libraries
node <skill-path>/scripts/token_inventory.js <in-scope files or src dir>

# Contrast: resolve tokens/classes to real values first, then compute
node <skill-path>/scripts/contrast.js "<fg>" "<bg>" [--size <px>] [--weight <n>]
node <skill-path>/scripts/contrast.js --pairs pairs.json
```

- Run `token_inventory.js` on the flow's files, and once on the whole source root when design-system drift is suspected. Its `signals` are leads to investigate, not findings.
- **Never estimate contrast by eye.** Every contrast claim in the report must come from `contrast.js` (or a browser measurement in Interactive mode) on resolved values. `contrast.js` accepts hex, rgb, hsl, oklch, bare shadcn HSL channels, and `tw:<color>-<shade>`.
- In Interactive mode, also run `inspect_page.js` (see [interactive-mode.md](./references/interactive-mode.md)) and treat its output as evidence for the passes below.
- If Node.js is unavailable, say so in Method & Evidence and mark contrast findings **Needs verification**.

#### 4.3 Audit Passes
Run the six passes defined in [methods.md](./references/methods.md). Each pass looks through a different lens and finds problems the others miss:

1. **Task walkthrough**: each persona, step by step, asking the four walkthrough questions.
2. **State inventory**: every empty, loading, error, partial, success, and edge-content state.
3. **Heuristic sweep**: every in-scope file against all 22 categories in [categories.md](./references/categories.md) (listed below).
4. **Accessibility conformance**: the WCAG 2.2 AA checklist.
5. **Visual craft review**: hierarchy, spacing, alignment, type, color, iconography, polish, and generic or template looks, grounded in the token inventory.
6. **Content review**: term list, action labels, errors, empty states, and voice.

The 22 categories:

1. **Group 1: Visual Design**: `[HIER]` Visual Hierarchy & Layout, `[TYPO]` Typography & Readability, `[COLOR]` Color, Contrast & Visual Cues, `[DSYS]` Visual Consistency & Design System Adherence, `[MOTION]` Motion & Animation.
2. **Group 2: Content & Language**: `[COPY]` Content, Microcopy & Clarity, `[STATE]` Empty, Loading & Error States, `[I18N]` Localization & Content Resilience.
3. **Group 3: Interaction & Structure**: `[NAV]` Navigation & Information Architecture, `[AFFORD]` Interaction Affordance & Touch Targets, `[FORM]` Forms, Input Validation & Friction, `[FLOW]` Task Flow Continuity & Friction, `[COGN]` Cognitive Load & Progressive Disclosure, `[SRCH]` Search, Filtering & Sorting *(Conditional)*, `[DATA]` Data Display & Visualization *(Conditional)*.
4. **Group 4: System Trust & Feedback**: `[TRUST]` Feedback, Confirmation & Error Prevention, `[A11Y]` Accessibility & Keyboard Operability, `[PERF]` Perceived Performance & Optimistic UI, `[ETHIC]` Dark Patterns & Ethical Design.
5. **Group 5: Platform & Context**: `[PLAT]` Platform-Specific Conventions & Safe Areas, `[ONBD]` Onboarding & First-Use Experience *(Conditional)*, `[PERS]` Personalization & State Persistence *(Conditional)*.

Also note **strengths** as you go: deliberate, well-executed decisions the team should protect.

> [!IMPORTANT]
> **SWEEP INTEGRITY RULES**:
> - **No Early Exit**: Do not stop after finding the first 2–3 obvious bugs. Run every pass, and evaluate every file in the flow against all applicable categories.
> - **Judgment vs Grep**: Give equal weight to content, copy clarity, and cognitive flow as to mechanical checks like missing `alt` tags. The most valuable findings are often a confusing step or a request for information the user doesn't have.
> - **Cross-File Consistency**: Compare styles and naming across components to detect styling drift and redundant inputs.

---

### Step 5: Verify & Rate Every Candidate Finding

1. **Verify** each candidate with the protocol in [false-positives.md](./references/false-positives.md): confirm it renders, trace parents and global styles, and check what the component library and platform already provide. Record anything ruled out under *Checked & cleared*.
2. **Assign confidence** using [severity.md](./references/severity.md): **Observed**, **Code-confirmed**, or **Needs verification**. Needs-verification items go to the *To Verify* table, not the findings list.
3. **Rate severity** from *Impact × Reach* using the lookup table and calibration examples in [severity.md](./references/severity.md). Write the reasoning on the finding (e.g. `Impedes × Core`).
4. **Rate effort** and **derive priority** (Now / Next / Later) using the rules in [severity.md](./references/severity.md).
5. **Merge duplicates**: one root cause in a shared component is one finding, with the instance count as evidence.

---

### Step 6: Reconcile With the Findings Ledger

`.ux-audit/findings.json` holds every finding across all runs, with IDs that never change. Follow [findings-ledger.md](./references/findings-ledger.md):

1. **Load** it with `node <skill-path>/scripts/ledger.js list --status all --flow <slug>`. If there is no ledger but `.ux-audit/reports/` contains reports, run `ledger.js migrate` once. Otherwise start empty.
2. **Match** each verified finding to an existing entry (category + rule + file, then anchor, then root cause). Matched findings keep their ID. Unmatched findings are **New**: allocate IDs with `ledger.js allocate <CAT>`.
3. **Classify** for the report: **New**, **Recurring** (open and seen again; show *First flagged*), **Regressed** (was resolved, now back), and **Resolved** (an open entry in this flow whose location you re-checked and found fixed).
4. **Respect decisions**: entries marked `wont-fix` or `false-positive` are not reported again. Count them as *Suppressed* in Method & Evidence.
5. **Update** the ledger entries and run `ledger.js validate`.

---

### Step 7: Synthesize, Write the Report & Update Context

1. **Synthesize** before writing, in this order:
   - **Themes**: group findings that share a root cause, and name the systemic fix for each.
   - **Scorecard**: score each dimension with the rubric in [report-template.md](./references/report-template.md).
   - **Top priorities**: the 3 changes with the most user and business value, written as outcomes.
   - **Verdict**: 2–3 plain-language sentences, written last.
2. Format the report using [report-template.md](./references/report-template.md). Save to `.ux-audit/reports/[YYYY-MM-DD]-[flow-slug].md` (append `-2`, `-3` if multiple runs occur on the same day).
3. Every finding must include:
   - **ID**: `[CAT-NN]` from the ledger (e.g. `[A11Y-01]`, `[FORM-02]`).
   - **Severity** with its *Impact × Reach* reasoning: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low.
   - **Confidence** with the evidence: Observed | Code-confirmed.
   - **Effort**, **Priority**, and **Theme** (if any).
   - **Location**: a link relative to the report (`../../src/Component.tsx#L42`), never `file:///`.
   - **Persona**: who is affected and what happens to them.
   - **Problem**: why it matters, with the principle or WCAG criterion.
   - **Recommendation**: design intent, then the fitting format: code diff, copy rewrite, or design spec.
   - **Acceptance criteria**: observable conditions that prove the fix.
4. Run the consistency check from the template's authoring directives (counts, roadmap, themes, scores).
5. Update `context.json`, setting `last_flow` and `last_updated: YYYY-MM-DD`.

---

### Step 8: Summary & Handoff

Output a concise summary in chat:
- The verdict (1–2 sentences).
- Scorecard in one line (e.g. `Visual 3 · Content 3 · Flow 2 · Trust 3 · A11y 2 · Platform 4`).
- Top 3 priorities, with IDs.
- Severity counts, Quick Wins count, and the number of items to verify.
- Path to the saved report file.

> [!CAUTION]
> **READ-ONLY FINISH**: Stop once the report is delivered. **Do not modify source code or implement fixes automatically.** Ask the developer which issues they would like to address, suggesting the *Now* column as the default starting point.

---

## Rating Summary

Full definitions, the lookup table, and calibration examples are in [severity.md](./references/severity.md).

- **Severity** (*Impact × Reach*): 🔴 **Critical** blocks the task or causes harm · 🟠 **High** causes errors, backtracking, or abandonment on a core or common path · 🟡 **Medium** causes hesitation or affects an edge path · 🔵 **Low** is cosmetic or polish.
- **Confidence**: **Observed** (rendered or measured) · **Code-confirmed** (source proves it, after verification) · **Needs verification** (listed separately, not counted).
- **Effort**: ⚡ **Quick Win** (<15 min) · **Low** (1–2 h) · **Medium** (half-day to 2 days) · **High** (multi-day).
- **Priority**: **Now** · **Next** · **Later**, derived from severity and effort.
