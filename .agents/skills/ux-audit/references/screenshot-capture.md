# Screenshot Capture (Interactive Mode)

When the developer provides a local dev server (e.g., `http://localhost:3000`) or staging URL, capture visual screenshots to audit rendered styling, actual cascade overrides, and responsive layouts across viewports.

---

## 1. Safety Guardrail: Read-Only Policy

`capture_screenshots.js` is strictly read-only.
- **NEVER** automate form submission, credit card checkout, account deletion, or state-mutating actions without the developer's explicit confirmation.
- Safe interactions: Read-only page navigation, focusing an input to inspect `:focus-visible` styling, typing test text into an input without submitting.

---

## 2. Environment Verification

1. Check if Playwright is installed:
   - Check `package.json` for `playwright` or test `node -e "require('playwright')"` in the project.
2. If not present, request developer permission to install:
   - **npm**:
     ```bash
     npm install -D playwright
     npx playwright install chromium
     ```
   - **pnpm**:
     ```bash
     pnpm add -D playwright
     pnpm exec playwright install chromium
     ```
3. If the developer declines or network is unavailable, **gracefully fall back to Source-only mode** or ask the developer to provide manual screenshots.

---

## 3. Running Multi-Viewport Capture

Execute [`capture_screenshots.js`](../scripts/capture_screenshots.js) passing the target URL, output folder, viewports, and optional settle delay in ms (default 800ms):

```bash
node <skill-path>/scripts/capture_screenshots.js <url> .ux-audit/screenshots/[YYYY-MM-DD]-[flow-slug] 375,768,1440 800
```

### Settle Delay Parameter
- The default 800ms delay ensures custom web fonts finish rendering, SPA client-side hydration resolves, and CSS entrance transitions complete before taking full-page screenshots.
- Increase to `1500`–`2000` ms for apps with heavier client-side data fetching or animated dashboards.

### Viewports Captured
- `375w.png`: Mobile viewport (375 × 900, 2x scale). Inspect touch target sizes, safe areas, hamburger menus, and layout reflow.
- `768w.png`: Tablet viewport (768 × 900, 2x scale). Inspect responsive grid breakpoints and drawer navigation.
- `1440w.png`: Desktop viewport (1440 × 900, 2x scale). Inspect line-lengths, typography scale, and multi-column hierarchy.

---

## 4. Referencing Screenshots in Audit Reports

- Store captures under `.ux-audit/screenshots/[YYYY-MM-DD]-[flow-slug]/`.
- In the audit report, cite screenshots directly when reporting visual issues (e.g. `Where: Hero CTA (visible in 375w.png)`).
