# UX Audit Report — Platform ROI & Status Per Platform (`/analytics/status-per-platform`)

Date: 2026-08-17
Audit mode: Source-only (Code inspection & UX heuristic audit)
Screenshots: none
Personas used:
- Alex: Active Job Seeker & Software Engineer tracking 50+ applications across 8+ platforms (LinkedIn, Indeed, Wellfound, Otta, etc.), evaluating which channels produce interviews vs. dead ends.
- Sam: Career Switcher & First-Time Tracker User needing clear conversion metrics, accessible contrast, guidance on platform ROI, and easy navigation to filtered applications.
Files reviewed:
- `app/(pages)/analytics/status-per-platform/page.tsx`
- `app/(pages)/analytics/components/platform-roi-dashboard.tsx`
- `app/(pages)/analytics/components/analytics-filter.tsx`
- `app/_components/tabs.tsx`
- `app/actions/analytics.ts`
Categories checked:
- Accessibility
- Color & contrast
- Navigation & information architecture
- Task-flow friction & actionability
- Data display & visualization
- Visual hierarchy & layout
- Content & microcopy
- Feedback & error handling
- Forms (no inputs other than filters)

---

## Executive Summary

The `/analytics/status-per-platform` page delivers high-value intelligence on channel yield, response rates, and pipeline status distributions per platform. The segmented progress bars and conversion badges provide a strong visual foundation.

However, the user experience is hampered by four key UX friction points:
1. **Dead-End Cards (Zero Actionability)**: Platform cards display detailed metrics (e.g. 14 applications, 3 interviews on LinkedIn), but provide no direct link or drill-down to `/applications?search=LinkedIn` to inspect or take action on those specific jobs.
2. **Distracting Perpetual Motion**: The highlight banner uses continuous CSS `animate-bounce` on `<Sparkles>`, creating continuous peripheral motion that causes cognitive fatigue and fails vestibular accessibility best practices.
3. **Inaccessible Badge & Text Contrast**: Rate badges and highlight text use `text-emerald-500` and `text-blue-500` on light background surfaces, failing WCAG AA 4.5:1 minimum contrast ratios.
4. **Missing Comparison Density**: For power users (Alex) applying across 6–10 platforms, the 2-column card grid requires excessive vertical scrolling without a compact table/matrix comparison mode.

Total findings: **0 Critical**, **4 Major**, and **5 Minor**.

---

## Findings Matrix

| Finding | Severity | Category | Persona | Location |
| :--- | :--- | :--- | :--- | :--- |
| Dead-end platform cards without drill-down links to `/applications` | Major | Task-flow friction | Alex & Sam | `platform-roi-dashboard.tsx:87` |
| Continuous `animate-bounce` animation on highlight banner sparkles | Major | Visual hierarchy / A11y | Alex & Sam | `platform-roi-dashboard.tsx:274, 300` |
| Low contrast `emerald-500` / `blue-500` text on light backgrounds (<4.5:1) | Major | Color & contrast | Sam | `platform-roi-dashboard.tsx:114, 124, 284` |
| Sorting controls lack ARIA state, group semantics, and direction indicators | Major | Accessibility | Alex & Sam | `platform-roi-dashboard.tsx:329-375` |
| Missing document `<h1>` landmark on Status Per Platform page | Minor | Accessibility | Sam | `status-per-platform/page.tsx:30` |
| Duplicate empty state branches across `page.tsx` and `platform-roi-dashboard.tsx` | Minor | Data display | Sam | `page.tsx:39` & `platform-roi-dashboard.tsx:50` |
| Filter reset uses `router.push("?")` leaving dangling query mark | Minor | Navigation | Alex | `platform-roi-dashboard.tsx:207` |
| Hardcoded fallback year `"2025"` instead of dynamic current year | Minor | Content & microcopy | Sam | `status-per-platform/page.tsx:37` |
| Lack of dense Table / Matrix comparison view for multi-platform tracking | Minor | Data display | Alex | `platform-roi-dashboard.tsx:379` |

---

## Detailed Findings

### Accessibility

#### Sorting Controls Lack ARIA Role & Pressed State Semantics
Severity: Major
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 329–375)
Persona affected: Screen reader users and keyboard navigators
Problem: The sort controls (`Volume`, `Interview Rate`, `Response Rate`, `Name`) are rendered as plain `<Button>` elements inside a generic `<div>`. They lack `role="group"`, `aria-label="Sort platforms by"`, and `aria-pressed={sortBy === "..."}`. Screen reader users cannot discern which sorting criterion is currently active.
Fix: Wrap sort controls in a container with `role="group"` and `aria-label="Sort platform data"`, and add `aria-pressed={sortBy === key}` to each sort button with visual sort indicator icons.

#### Missing Document `<h1>` Heading Landmark
Severity: Minor
Where: `app/(pages)/analytics/status-per-platform/page.tsx` (line 31)
Persona affected: Screen reader users
Problem: The page root lacks a semantic `<h1>` element. The first heading encountered is the `<h2>` inside the dashboard, violating WAI-ARIA heading structure guidelines.
Fix: Add `<h1 className="sr-only">Platform ROI & Application Status</h1>` at the top of `StatusPerPlatformPage`.

---

### Color & Contrast

#### Low Contrast on Conversion Badges & Highlight Banner Text
Severity: Major
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 114, 124, 284)
Persona affected: Sam (low vision or bright sunlight environments)
Problem: The badges and banner text use `text-emerald-500` (contrast ratio ~3.1:1 on light background) and `text-blue-500` (~3.8:1). Both fail WCAG 2.1 AA 4.5:1 standard for body and badge text.
Fix: Update colors to `text-emerald-700 dark:text-emerald-400` and `text-blue-700 dark:text-blue-400`.

---

### Task-Flow Friction & Actionability

#### Dead-End Platform Cards Without Drill-Down Links
Severity: Major
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 87–195)
Persona affected: Alex (trying to investigate specific platform applications)
Problem: When a user sees a platform with high interview volume (e.g. "LinkedIn: 15 applications, 3 interviews"), there is no direct link to view those applications. The user must manually navigate to the `/applications` table and type "LinkedIn" in the search box.
Fix: Add an actionable link button in the card header/footer: `<Link href={/applications?search=${encodeURIComponent(platform.platformName)}}>View applications →</Link>`.

---

### Visual Design & Hierarchy

#### Perpetual `animate-bounce` Causes Cognitive & Vestibular Fatigue
Severity: Major
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 274, 300)
Persona affected: Alex & Sam
Problem: The `<Sparkles className="h-5 w-5 text-emerald-500 animate-bounce" />` icon bounces continuously without stopping. Continuous loop animations in analytical interfaces distract the user from reading conversion numbers and violate motion reduction best practices (`prefers-reduced-motion`).
Fix: Replace `animate-bounce` with a static crisp icon or a subtle single-pulse `animate-pulse` constrained by `motion-safe:`.

#### Hardcoded Fallback Year `"2025"`
Severity: Minor
Where: `app/(pages)/analytics/status-per-platform/page.tsx` (line 37)
Persona affected: Sam
Problem: If the user has no applications, `AnalyticsFilter` receives `["2025"]` instead of the dynamic current year.
Fix: Use `new Date().getFullYear().toString()`.

---

### Data Display & Interaction

#### Dual Duplicate Empty State Logic
Severity: Minor
Where: `app/(pages)/analytics/status-per-platform/page.tsx` (lines 39–48) and `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 50–74, 206–208)
Persona affected: Sam
Problem: Both `page.tsx` and `PlatformRoiDashboard` implement separate, slightly different empty state cards. This creates redundancy and maintenance debt.
Fix: Consolidate empty state rendering inside `PlatformRoiDashboard` (or `page.tsx`) so only one canonical empty state exists.

#### Filter Reset Uses `router.push("?")`
Severity: Minor
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (line 207)
Persona affected: Alex
Problem: When clearing filters from the empty state, `router.push("?")` leaves a trailing `?` in the browser URL.
Fix: Use `usePathname()` to push clean `/analytics/status-per-platform`.

#### Single View Mode (No Dense Comparison Table)
Severity: Minor
Where: `app/(pages)/analytics/components/platform-roi-dashboard.tsx` (lines 379–384)
Persona affected: Alex (tracking 8+ platforms)
Problem: Cards are great for visual distribution, but comparing 10 platforms across interview rates, response rates, and totals requires scrolling through 5 rows of 2-column cards.
Fix: Add a toggle between **Grid View** (visual cards with segmented progress bars) and **Table View** (compact sortable comparison table with rates, volume, and quick links).

---

## Positive Observations

- **Segmented Progress Bars**: The proportional color-coded status bar on each card provides an intuitive visual distribution of application outcomes per platform.
- **Dynamic Sorting**: Instant client-side sorting by volume, interview rate, response rate, and name allows users to re-order cards quickly based on their analytical focus.
- **Contextual Highlight Banners**: Surfacing the `#1` top interview channel and top response channel with actual counts and conversion rates provides helpful strategic coaching.
