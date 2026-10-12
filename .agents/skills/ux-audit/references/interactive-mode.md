# Interactive Mode

When the developer provides a running app (a local dev server like `http://localhost:3000`, or a staging URL), audit the rendered UI. Rendered evidence is rated **Observed**, which beats anything inferred from source. Use both: the rendered page shows *what* is wrong; the source shows *where* to fix it.

---

## 1. Safety Guardrail: Read-Only Policy

The bundled scripts only navigate, press Tab, read the DOM, and take screenshots.
- **NEVER** automate form submission, checkout, account deletion, or other state-changing actions without the developer's explicit confirmation for that specific action.
- Safe without asking: navigating between pages, pressing Tab, focusing an input, hovering, resizing, and emulating dark mode or reduced motion.
- Ask first: submitting a form (even empty, to see validation), signing in, or anything that writes data. On a staging server with real data, ask before every interaction beyond reading.
- Screenshots of staging or production may contain personal data. Suggest adding `.ux-audit/screenshots/` to `.gitignore`.

---

## 2. Environment

1. The scripts load Playwright and axe-core **from the audited project**, so they must run from the project root.
2. If Playwright is missing, ask the developer before installing:
   ```bash
   npm install -D playwright axe-core
   npx playwright install chromium
   ```
   (pnpm: `pnpm add -D playwright axe-core && pnpm exec playwright install chromium`)
3. axe-core is optional. Without it, `inspect_page.js` still records structure, targets, and keyboard results, and the summary says axe was unavailable.
4. If the developer declines or there's no network, **fall back to Source-Only mode**, or ask for manual screenshots (Design Review mode for the visual categories).
5. If your agent has its own browser tools (Playwright MCP, a built-in browser, a browser extension), use them for the exploratory checks in section 5. Use the scripts for repeatable, measured evidence.

---

## 3. Run the Inspection

```bash
node <skill-path>/scripts/inspect_page.js <url> .ux-audit/screenshots/[YYYY-MM-DD]-[flow-slug] --widths 375,1440
```

| Option | Use when |
| :--- | :--- |
| `--widths 375,768,1440` | Tablet layouts matter (add `320` to test reflow at the WCAG 1.4.10 minimum) |
| `--color-scheme dark` | The product supports dark mode. Run a second pass into a `-dark` folder. |
| `--reduced-motion` | The UI animates. Confirm motion stops or reduces. |
| `--storage-state auth.json` | The flow is behind sign-in. The developer exports a Playwright storage state; never ask for passwords. |
| `--focus-shots` | You need to confirm a focus indicator visually (saves a crop of each focus stop to `focus/NN.png`). |
| `--settle 2000` | Data-heavy pages or entrance animations are still moving at 800 ms. |
| `--tabs 80` | Long pages with many controls. |

For a quick visual pass with no checks, use `capture_screenshots.js <url> <out_dir> [widths] [settle_ms]`.

Each width produces `<w>w-fold.png` (the first screen, which is what users judge first), `<w>w.png` (full page), and `inspect-<w>.json` (details). Look at the fold screenshots first.

---

## 4. Turning Results into Findings

Automated results are **evidence, not findings**. Every result still needs a persona, an Impact × Reach rating from [severity.md](./severity.md), and a link to the source location that causes it. Merge results that share a root cause.

| Result | Becomes | Notes |
| :--- | :--- | :--- |
| `axe.violations` with WCAG tags | `A11Y` or the matching category (e.g. `color-contrast` → `COLOR`, `label` → `FORM`), **Observed** | Cite the WCAG criterion. Rate by impact on the persona, not by axe's `impact` label. |
| `axe.violations` with `best_practice_only: true` | Usually Medium/Low, or a note | Not a WCAG failure. Say so in the finding. |
| `axe.needs_review` | **To Verify** table, unless you confirm it yourself from the screenshot | Commonly contrast over images or gradients. |
| `targets.items` with `fails_2_5_8: true` | `AFFORD`, fails WCAG 2.5.8 | Usually 🟠 High on a core action. |
| `targets.items` 24–43px on touch-first products | `AFFORD`, below platform guidance (not a WCAG failure) | Usually 🟡 Medium. Cite Apple HIG / Material, not WCAG. |
| `keyboard.stops` with `visible_focus_change: false` | `A11Y`, WCAG 2.4.7 | **Confirm with `--focus-shots` first.** Indicators drawn by pseudo-elements or on a parent aren't detected. |
| `keyboard.stops` with `obscured_by` | `A11Y`/`PLAT`, WCAG 2.4.11 | Typically sticky headers, cookie banners, or chat widgets covering focused elements. |
| `keyboard.stops` with an empty `name` | `A11Y`, WCAG 4.1.2 | Cross-check with axe `button-name` / `link-name` to avoid filing it twice. |
| Tab order that jumps around visually (compare `rect` order with the layout) | `A11Y`/`NAV`, WCAG 2.4.3 | Caused by CSS reordering, `tabindex > 0`, or DOM order. |
| `structure.headings` that skip levels or have no `h1`; missing `main` landmark | `A11Y`/`HIER` | Usually 🔵 Low to 🟡 Medium. |
| `structure.horizontal_overflow: true` at 320–375px | `PLAT`, WCAG 1.4.10 | Content cut off or requiring sideways scroll on phones. |
| `console_errors` | Method & Evidence note; a finding only if a user-visible state breaks | Hydration errors often explain flicker or broken interactions. |

> Automated tools catch only a portion of accessibility issues. A clean axe run does not mean the flow is accessible. The persona walkthrough, keyboard results, and your own review of the screenshots still matter.

---

## 5. Exploratory Checks (with the agent's browser tools)

These need judgment or interaction beyond the scripts. Do the read-only ones freely; ask before anything that writes data.

- **States**: Find the empty, loading, error, and long-content versions of each screen. Throttle the network to see loading states. Use a test account or seed data that has no items to see empty states.
- **Validation**: With permission, submit an empty form on a local dev server and review the error presentation, focus movement, and wording.
- **Modals and menus**: Open them (opening is read-only). Check that focus moves inside, Tab stays inside, Escape closes them, and focus returns to the trigger.
- **Zoom and text size**: Zoom to 200%. Check that nothing overlaps or is cut off (WCAG 1.4.4).
- **Hover and focus states**: Hover primary controls. Check that interactive elements look interactive.

---

## 6. Referencing Evidence in Reports

- Store everything under `.ux-audit/screenshots/[YYYY-MM-DD]-[flow-slug]/`.
- In the **Location** field, give the source file and line that causes the issue, and add the screenshot as evidence: `(evidence: 375w-fold.png, hero CTA)`.
- In **Method & Evidence**, record the URL, widths, emulation settings, axe version if available, and any check that could not run.
