# UX Audit Skill

An Agent Skill that audits web and native mobile user interfaces the way a senior head of design would. It produces a report with a plain-language verdict, root-cause themes, calibrated severities, and fixes your team can act on: code diffs, copy rewrites, or design specs, each with acceptance criteria.

Built for developers, designers, product managers, and vibe coders who want to know what's wrong with their UI, why it matters, and what to fix first.

---

## Key Capabilities

- **Design-Lead Report**: A plain-language verdict, a 6-dimension scorecard, what's working, top priorities written as outcomes, root-cause themes, and a Now / Next / Later roadmap, followed by the detailed findings.
- **Six Audit Passes**: Task walkthrough per persona, state inventory, heuristic sweep, WCAG 2.2 AA conformance, visual craft review, and content review. Each finds problems the others miss.
- **22 Categories**: Visual hierarchy, typography, color and contrast, design-system consistency, motion, microcopy, states, localization and content resilience, navigation, affordance, forms, task flow, cognitive load, search, data display, feedback and error prevention, accessibility, perceived performance, dark patterns, platform conventions, onboarding, and persistence.
- **Calibrated Ratings**: Severity derived from *Impact × Reach* with calibration examples; separate Confidence (Observed / Code-confirmed / Needs verification), Effort, and Priority.
- **False-Positive Protection**: A verification protocol plus a catalog of what Radix/shadcn, Headless UI, MUI, react-hook-form, Next.js, and native HTML already handle, so the audit doesn't flag behavior you already have.
- **Measured Evidence**:
  - `contrast.js`: real WCAG contrast ratios (hex, rgb, hsl, oklch, shadcn tokens, Tailwind colors).
  - `token_inventory.js`: design-token drift (distinct colors, type sizes, radii, shadows, off-grid spacing, icon libraries, disabled text scaling) for web, Flutter, SwiftUI, and Compose.
  - `inspect_page.js`: rendered checks with axe-core, a keyboard Tab walk (focus visibility, obscured focus, unnamed controls), touch-target measurement, heading structure, and reflow.
- **Three Audit Modes**: *Source-Only* (default), *Interactive* (a running app via Playwright), and *Design Review* (screenshots and mockups).
- **Native Mobile Support**: Platform conventions (Apple HIG, Material 3) and code signals for React Native, Flutter, SwiftUI, and Jetpack Compose.
- **Findings Ledger**: Stable IDs across runs and flows. Tracks resolved, recurring, and regressed issues, and remembers "won't fix" and "false positive" decisions so they aren't raised again.
- **Read-Only Safety**: Never modifies your code or submits forms without asking. You decide what to fix.

---

## Directory Structure

```text
ux-audit/
├── SKILL.md                          # Main skill instruction file (v2.2.0)
├── README.md                         # Documentation
├── CHANGELOG.md                      # Release and update history
├── LICENSE                           # MIT License
├── examples/
│   └── example-run.md                # Reference walkthrough and gold-standard report
├── references/
│   ├── categories.md                 # 22 audit categories, rules, and code signals
│   ├── methods.md                    # The six audit passes
│   ├── severity.md                   # Severity, confidence, effort, priority + calibration
│   ├── false-positives.md            # Verification protocol and library/platform defaults
│   ├── findings-ledger.md            # Stable IDs, statuses, and matching rules across runs
│   ├── interactive-mode.md           # Rendered-page inspection and how to read results
│   ├── native-mobile.md              # iOS/Android conventions and native code signals
│   ├── context-schema.md             # Formal JSON schema for .ux-audit/context.json
│   ├── interview.md                  # Auto-detect and fallback intake protocol
│   └── report-template.md            # Report template and scorecard rubric
├── scripts/
│   ├── inspect_page.js               # axe-core, keyboard walk, touch targets, screenshots
│   ├── capture_screenshots.js        # Screenshots only (first screen + full page)
│   ├── contrast.js                   # WCAG contrast calculator
│   ├── token_inventory.js            # Design-token drift inventory
│   ├── ledger.js                     # Findings ledger: list, allocate, validate, migrate
│   └── lib/resolve.js                # Loads Playwright/axe-core from the audited project
```

---

## Installation

### Claude Code

**Personal (all projects)**:
- *macOS / Linux*:
  ```bash
  mkdir -p ~/.claude/skills/ux-audit
  cp -r path/to/ux-audit/* ~/.claude/skills/ux-audit/
  ```
- *Windows (PowerShell)*:
  ```powershell
  New-Item -ItemType Directory -Force -Path "$HOME\.claude\skills\ux-audit"
  Copy-Item -Recurse -Force -Path "path\to\ux-audit\*" -Destination "$HOME\.claude\skills\ux-audit"
  ```

**Project-specific**: copy the same files into your project's `.claude/skills/ux-audit/` directory.

### Google Antigravity & Codex CLI

Place the skill in `.agents/skills/ux-audit/` at the repository root, or in your global configuration, using the same commands with that destination.

### Requirements

- **Node.js** for the bundled scripts.
- **Interactive mode only**: Playwright, and optionally axe-core, installed in the *audited project*. The agent asks before installing:
  ```bash
  npm install -D playwright axe-core
  ```

---

## Usage

Ask naturally:
- *"Review this checkout flow for UX friction."*
- *"Audit our signup form for accessibility and usability issues."*
- *"Why does this dashboard feel off? Make it look more professional."*
- *"Check our billing page for dark patterns."*
- *"Here are screenshots of our onboarding. What would you change?"*
- *"Audit the running app at http://localhost:3000/settings."*

The first run drafts your project context from the repo and asks you to confirm it. Later runs reuse it.

After a report, you can tell the agent things like *"FORM-03 is a false positive, the label comes from the wrapper"* or *"we won't fix DSYS-02"*. The ledger remembers this for future audits.

---

## What Gets Stored in Your Project

```text
.ux-audit/
├── context.json                      # Project and persona context
├── findings.json                     # Findings ledger: stable IDs, statuses, history
├── reports/
│   └── 2026-08-22-checkout.md        # Audit report
└── screenshots/                      # Interactive mode only
    └── 2026-08-22-checkout/
        ├── 375w-fold.png             # First screen, mobile
        ├── 375w.png                  # Full page, mobile
        ├── 1440w-fold.png            # First screen, desktop
        ├── 1440w.png                 # Full page, desktop
        └── inspect-1440.json         # axe-core, keyboard, structure details
```

Commit `context.json`, `findings.json`, and `reports/` so your team shares one history. Add `.ux-audit/screenshots/` to `.gitignore`: screenshots are large and may contain personal data.

---

## License

MIT — see [LICENSE](./LICENSE).
