# UX Audit — Analytics Overview

Date: 2026-08-17
Previous audit of this flow: 2026-08-12
Audit mode: Source-only
Screenshots: none
Personas used:
- Alex: Active Job Seeker & Software Engineer tracking 50+ applications across platforms, looking for quick ROI metrics, funnel conversion velocity, and actionable insights into bottlenecks.
- Sam: Career Switcher & First-Time Tracker User needing clear metric explanations, guidance on empty states, benchmarks, and friction-free navigation.
Files reviewed:
- `app/(pages)/analytics/layout.tsx`
- `app/_components/tabs.tsx`
- `app/(pages)/analytics/overview/page.tsx`
- `app/(pages)/analytics/components/analytics-filter.tsx`
- `app/(pages)/analytics/components/kpi-summary.tsx`
- `app/(pages)/analytics/components/best-platforms-card.tsx`
- `app/(pages)/analytics/components/ghosting-risk-card.tsx`
- `app/(pages)/analytics/components/domain-leaderboard-card.tsx`
- `app/(pages)/analytics/components/pie-chart.tsx`
- `app/(pages)/analytics/components/yearly-trends-card.tsx`
- `app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx`
- `app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx`
- `app/actions/analytics.ts`
- `components/ui/card.tsx`
Categories checked:
- Visual hierarchy & layout
- Typography
- Color & contrast
- Visual consistency & design system adherence
- Content & microcopy
- Empty, loading & error states
- Navigation & information architecture
- Interaction & affordance
- Task-flow friction
- Cognitive load & complexity
- Data display & visualization
- Feedback, confirmation & error prevention
- Accessibility
- Perceived performance
- Platform-specific conventions (Web)
- Forms & input (n/a — read-only dashboard flow with select filters)
- Onboarding & first-use experience (n/a — standard analytics dashboard)
- Personalization & state persistence (n/a — search param state used)

## Summary

This is the third audit covering the `/analytics/overview` dashboard after prior iterations on the general analytics suite. The core layout and accessibility foundations have improved substantially. This comprehensive sweep identified **0 Critical**, **6 Major**, and **9 Minor** issues, focusing on filter synchronization (Domain Leaderboard ignoring active filters), dual year dropdown desynchronization, empty state copy nuances for 0% conversion, and document heading structure.

## Resolved since last audit

- **Visual Hierarchy & Layout — Strategy Coaching Cards Uneven Height at Tablet (768px)** — no longer present as of this audit. The grid breakpoint was updated from `md:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-3` in `app/(pages)/analytics/overview/page.tsx`.
- **Accessibility — YearlyTrendsCard Tab Switcher Uses `<button>` Without ARIA Tab Pattern** — no longer present as of this audit. Added `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"` markup to `app/(pages)/analytics/components/yearly-trends-card.tsx`.

## Recurring issues

### Visual Design

#### Typography — Section Heading Scale Remains Inverted at `text-xs`
Severity: Minor
First flagged: 2026-08-12
Where: `app/(pages)/analytics/overview/page.tsx` (lines 109, 126, 141)
Persona affected: Alex & Sam
Problem: While the section heading color was updated to `text-primary`, section headings (`<h2>`) still use `text-xs font-bold uppercase tracking-wider` (12px). They remain smaller than standard body copy (`text-sm` at 14px, `text-base` at 16px) and smaller than card titles (`text-base`/`text-lg`), failing to provide clear visual anchoring across page sections.
Fix: Increase section heading text size to `text-sm font-bold uppercase tracking-wider` (or `text-base font-semibold`) with consistent spacing to anchor visual hierarchy.

#### Color & Contrast — Low Contrast in Popover Benchmark Text and Metric Empty States
Severity: Minor
First flagged: 2026-08-12
Where: `app/(pages)/analytics/components/kpi-summary.tsx` (lines 50, 89, 128, 167)
Persona affected: Sam (low-vision user in light mode)
Problem: Benchmark highlight text inside KPI info popovers uses `text-emerald-500` (~2.4:1 contrast ratio against white background) and `text-amber-500` (~2.1:1 ratio), which fall significantly below the WCAG AA requirement of 4.5:1 for normal text size.
Fix: Update the color utility classes to `text-emerald-700 dark:text-emerald-400`, `text-amber-700 dark:text-amber-400`, and `text-blue-700 dark:text-blue-400` to guarantee WCAG AA 4.5:1 minimum contrast in both light and dark themes.

## New findings

### Visual Design

#### Visual Hierarchy & Layout — Orphan Strategy Coaching Card on `sm` (Tablet/Landscape) Viewports
Severity: Major
Where: `app/(pages)/analytics/overview/page.tsx` (line 130)
Persona affected: Sam (viewing on tablet or horizontal mobile screen)
Problem: The Strategy Coaching grid uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. With exactly 3 cards, on viewports between 640px and 1023px (`sm` breakpoint), row 1 contains 2 cards while row 2 contains a single card (`DomainLeaderboardCard`) in the left column with the right column completely empty, resulting in an asymmetrical, unbalanced layout. (Inferred from source, not visually confirmed).
Fix: Add `sm:col-span-2 lg:col-span-1` to the third card (`DomainLeaderboardCard`) wrapper so it spans full width on 2-column layouts.

#### Visual Consistency & Design System Adherence — Inconsistent Card Header Typography in Strategy Coaching
Severity: Minor
Where: `app/(pages)/analytics/components/domain-leaderboard-card.tsx` (lines 20–25) vs `best-platforms-card.tsx` (lines 27–32) and `ghosting-risk-card.tsx` (lines 16–22)
Persona affected: Alex & Sam
Problem: `DomainLeaderboardCard` uses `<CardTitle className="text-base font-bold">ATS Domain Performance</CardTitle>`, while its sibling coaching cards use `<CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">`. This causes visual styling drift within the same 3-card coaching section.
Fix: Align `DomainLeaderboardCard` with its sibling cards by changing the card title style to `text-xs font-semibold uppercase tracking-wider text-muted-foreground`.

#### Color & Contrast — Misleading 5% Minimum Width Bar for 0% Success Rate
Severity: Minor
Where: `app/(pages)/analytics/components/domain-leaderboard-card.tsx` (line 53)
Persona affected: Alex (analyzing application domain success rates)
Problem: The progress bar width uses `style={{ width: `${Math.max(percentageVal, 5)}%` }}`. When an ATS domain has a 0.0% interview success rate (e.g. 5 applications, 0 interviews), it renders a 5% filled primary-color bar, falsely giving the visual impression of non-zero progress.
Fix: Change the style expression to `style={{ width: percentageVal > 0 ? `${Math.max(percentageVal, 5)}%` : "0%" }}` so zero-percent conversion displays an empty bar.

### Content & Language

#### Content & Microcopy — Deceptive "Highest Converting" Label When Interview Rate is 0%
Severity: Major
Where: `app/(pages)/analytics/components/best-platforms-card.tsx` (lines 56–58)
Persona affected: Sam (new job tracker user with applications but no interviews yet)
Problem: When the user has logged applications on a platform (e.g., LinkedIn) but has not yet received any interviews, `bestPlatform.interviewRate` is `0.0%`. The card renders `0.0% rate` alongside the caption `"Your highest converting job platform right now."`, which is contradictory and misleading.
Fix: Add a conditional check: if `bestPlatform.interviewRate === 0`, display helper copy like `"No interviews recorded on this platform yet. Keep applying to unlock conversion insights."` instead of praising a 0.0% rate.

#### Empty, Loading & Error States — Hollow Pie Chart and Missing CTA on Empty Status Breakdown
Severity: Major
Where: `app/(pages)/analytics/components/pie-chart.tsx` (lines 59–176)
Persona affected: Sam (first-time user without applications)
Problem: When `data` is empty and `total` is 0, `PieChartComponent` renders an empty chart canvas, a center label showing "0 TOTAL", and an empty list. There is no empty-state illustration, helper description, or link encouraging the user to add their first application.
Fix: Add an empty-state condition: when `grandTotal === 0`, render a clean placeholder state with a brief message (e.g., "No application statuses to display") and a CTA link to `/applications`.

#### Content & Microcopy — Stale Fallback Year in Analytics Filter
Severity: Minor
Where: `app/(pages)/analytics/overview/page.tsx` (lines 102, 152) and `statuses-per-year-bar-chart.tsx` (line 65)
Persona affected: Alex & Sam
Problem: When no applications exist in the database, the fallback year defaults to a hardcoded string `["2025"]` instead of dynamically resolving the current calendar year (`new Date().getFullYear().toString()`), causing the filter and chart headers to default to a past year.
Fix: Replace hardcoded `["2025"]` with `[new Date().getFullYear().toString()]`.

### Interaction & Structure

#### Navigation & Information Architecture — Domain Leaderboard Card Ignores Month & Year Filters
Severity: Major
Where: `app/actions/analytics.ts` (lines 19–75) & `app/(pages)/analytics/overview/page.tsx` (line 74)
Persona affected: Alex (filtering overview analytics by a specific time range)
Problem: When a user selects a specific Month or Year in the `AnalyticsFilter` toolbar, `getDomainLeaderboard()` is called without `month` or `year` parameters because the server action does not accept filter arguments. As a result, the ATS Domain Performance card displays lifetime aggregate numbers while all other cards display filtered period metrics, causing confusion and discrepancies.
Fix: Update `getDomainLeaderboard(month?: string, year?: string)` to accept filter parameters and apply them to its SQL query matching the rest of the analytics actions.

#### Task-Flow Friction — Desynchronized Dual Year Selectors in Yearly Trends Card
Severity: Major
Where: `app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx` (lines 60, 75–89) & `total-applications-per-year-bar-chart.tsx` (lines 65, 80–94)
Persona affected: Alex (exploring yearly trends across different views)
Problem: When no global year filter is applied, each of the two sub-charts inside `YearlyTrendsCard` maintains its own independent `useState` for year selection. Changing the year on the "Status Breakdown" tab does not propagate to the "Total Volume" tab, leading to divergent states within the same card. Furthermore, changing this local year dropdown changes only that single chart while leaving the rest of the Overview page on "All Years".
Fix: Lift the local `userSelectedYear` state up to `YearlyTrendsCard` (so switching tabs maintains the selected year), and visually distinguish it or synchronize it with the top toolbar.

#### Interaction & Affordance — ARIA Tabs Missing Arrow Key Keyboard Navigation
Severity: Minor
Where: `app/(pages)/analytics/components/yearly-trends-card.tsx` (lines 61–95)
Persona affected: Alex (keyboard-only user)
Problem: While the container has `role="tablist"` and tabs have `role="tab"`, there is no `onKeyDown` handler to support standard WAI-ARIA ArrowLeft / ArrowRight navigation between tabs. A keyboard user pressing arrow keys will not move focus or switch tabs.
Fix: Implement an `onKeyDown` handler on the tablist/tabs that cycles focus and active tab on ArrowLeft and ArrowRight key presses.

#### Navigation & Information Architecture — Missing Landmark and `aria-current` on Analytics Sub-Navigation
Severity: Minor
Where: `app/_components/tabs.tsx` (lines 22–45)
Persona affected: Alex & Sam (screen reader users)
Problem: The analytics section tabs container is rendered as a generic `<div>` instead of a semantic `<nav aria-label="Analytics subpages">`, and the active tab `<Link>` does not set `aria-current="page"`. Screen readers cannot identify the navigation landmark or detect which subpage is active.
Fix: Change the container to `<nav aria-label="Analytics sections">` and add `aria-current={isActive ? "page" : undefined}` to the tab links.

#### Navigation & Information Architecture — Filter Reset Leaves Dangling URL Query Character
Severity: Minor
Where: `app/(pages)/analytics/components/analytics-filter.tsx` (line 52)
Persona affected: Alex & Sam
Problem: When clicking "Reset" in the filter toolbar, `router.push("?")` pushes a literal question mark, resulting in a trailing `?` in the browser URL (`/analytics/overview?`).
Fix: Use `router.push("/analytics/overview")` (or `window.location.pathname`) to produce a clean URL without a trailing `?`.

### System Trust & Feedback

#### Accessibility — Missing `<h1>` Document Heading on Overview Page
Severity: Major
Where: `app/(pages)/analytics/overview/page.tsx` (lines 94–160)
Persona affected: Alex & Sam (screen reader users and keyboard navigation)
Problem: The page contains no `<h1>` heading. Headings jump straight to `<h2>Key Performance Rates</h2>` and `<h3>` inside card titles. This violates WCAG 2.1 Level AA (SC 1.3.1 Info and Relationships, SC 2.4.6 Headings and Labels) and prevents screen readers from understanding the primary title and context of the page upon entry.
Fix: Add an accessible `<h1>` heading (e.g. `<h1 className="sr-only">Analytics Overview</h1>` or a visible top header section) at the beginning of the Overview page content.

#### Accessibility — Missing Progressbar Role and Semantics in ATS Domain Leaderboard
Severity: Minor
Where: `app/(pages)/analytics/components/domain-leaderboard-card.tsx` (lines 50–56)
Persona affected: Alex (screen reader user)
Problem: The success rate progress bar is implemented with plain `<div>` elements without `role="progressbar"`, `aria-valuenow={percentageVal}`, `aria-valuemin={0}`, `aria-valuemax={100}`, or an accessible description. Assistive technology users cannot perceive the visual bar representation.
Fix: Add `role="progressbar"`, `aria-valuenow={percentageVal}`, `aria-valuemin={0}`, `aria-valuemax={100}`, and `aria-label={`${item.domain} interview rate: ${percentageText}%`}` to the progress container.

#### Perceived Performance — Layout Shift (CLS) on Dynamic Chart Loading
Severity: Minor
Where: `app/(pages)/analytics/overview/page.tsx` (lines 18–21, 27–30)
Persona affected: Alex & Sam
Problem: The dynamic import loading fallbacks for `PieChartComponent` and `YearlyTrendsCard` use `h-64` (256px), whereas the rendered cards with headers, content, and footers are ~360px–380px tall. When the charts finish client-side hydration, the page visibly jumps downward. (Inferred from source, not visually confirmed).
Fix: Adjust the fallback skeleton height to `min-h-[360px]` or `h-[370px]` to closely match the rendered card geometry.
