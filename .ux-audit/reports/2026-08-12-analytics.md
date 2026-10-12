# UX Audit — Analytics Suite (Overview, Platform ROI, Strategic Insights)

Date: 2026-08-12
Previous audit of this flow: none
Audit mode: Interactive
Screenshots: `.ux-audit/screenshots/2026-08-12-analytics/`
Personas used:

- Alex: Active Job Seeker & Software Engineer tracking 50+ applications across platforms, looking for quick ROI metrics and funnel conversion velocity.
- Sam: Career Switcher & First-Time Tracker User needing clear metric explanations, benchmarks, and friction-free navigation.
  Files reviewed:
- `app/(pages)/analytics/layout.tsx`
- `app/_components/tabs.tsx`
- `app/(pages)/analytics/overview/page.tsx`
- `app/(pages)/analytics/status-per-platform/page.tsx`
- `app/(pages)/analytics/insights/page.tsx`
- `app/(pages)/analytics/components/analytics-filter.tsx`
- `app/(pages)/analytics/components/kpi-summary.tsx`
- `app/(pages)/analytics/components/pie-chart.tsx`
- `app/(pages)/analytics/components/platform-roi-dashboard.tsx`
- `app/(pages)/analytics/components/yearly-trends-card.tsx`
- `app/(pages)/analytics/components/blackhole-breakdown-card.tsx`
- `app/(pages)/analytics/components/best-platforms-card.tsx`
- `app/(pages)/analytics/components/ghosting-risk-card.tsx`
- `app/(pages)/analytics/components/domain-leaderboard-card.tsx`
- `app/(pages)/analytics/components/role-targeting-card.tsx`
  Categories checked:
- Visual hierarchy & layout
- Typography
- Color & contrast
- Navigation & information architecture
- Interaction & affordance
- Content & microcopy
- Accessibility
- Perceived performance
- Task-flow friction
- Platform-specific conventions (Web)

---

## Summary

The Analytics suite provides rich data visualizations and funnel breakdown tools across three subpages (Overview, Platform ROI, Strategic Insights). However, severe usability bottlenecks exist around chart accessibility, mobile table responsive scaling, empty state filter handling, and metric clarity. Across the 15 reviewed files, the audit identified **2 Critical**, **4 Major**, and **3 Minor** UX/UI issues.

---

## New findings

### Accessibility — Donut Chart Screen Reader & Keyboard Access Barrier

- **Severity**: Critical
- **Where**: `app/(pages)/analytics/components/pie-chart.tsx` (lines 92–165)
- **Persona affected**: Alex (keyboard/screen reader user) & Sam
- **Problem**: Recharts `<PieChart>` rendered inside dynamic CSR wrapper lacks keyboard focusability (`tabIndex={0}`), ARIA labels (`role="img"` or `aria-label="Status Breakdown Donut Chart"`), and keyboard navigation for slices. Screen reader users cannot inspect slice values or interact with chart segments. The legend below uses static `<ul>` items without focus rings or hover synchronization with chart segments.
- **Fix**: Wrap `<PieChart>` in an accessible container with `role="img"` and `aria-label="Status distribution chart showing total applications and status breakdown"`. Enhance the legend items with `tabIndex={0}`, focus rings (`focus-visible:ring-2`), and synchronized segment highlighting on hover/focus.

### Color & Contrast — Color-Only Signal in Unsuccessful Endings Progress Bar

- **Severity**: Critical
- **Where**: `app/(pages)/analytics/components/blackhole-breakdown-card.tsx` (lines 44–56)
- **Persona affected**: Sam (color-blind or low-vision user)
- **Persona Context**: Color-blind users cannot distinguish ghosted vs rejected segments relying solely on hue.
- **Problem**: The horizontal segmented progress bar uses `bg-slate-400 dark:bg-slate-500` for Ghosted and `bg-rose-500` for Explicit Rejections without texture, pattern fill, or text labels within the bar segments. Color is the sole visual indicator differentiating ghosted applications from rejections in the progress bar graphic.
- **Fix**: Add distinct CSS diagonal stripe patterns or inline percentage/label text overlay on bar segments, and add `aria-label="Segmented progress bar: Ghosted X%, Rejected Y%"` on the bar container.

---

### Navigation & Information Architecture — Filter State Persistence & Reset Friction

- **Severity**: Major
- **Where**: `app/_components/tabs.tsx` (lines 24–46) & `app/(pages)/analytics/components/analytics-filter.tsx`
- **Persona affected**: Alex (filtering by specific month/year across analytics tabs)
- **Problem**: When switching between Analytics tabs (Overview, Platform ROI, Strategic Insights), URL parameters `month` and `year` are preserved, but secondary subpage state filters (such as platform selection or search keywords) are dropped. Additionally, tab transitions perform hard server navigation without soft view transitions, causing noticeable layout flash.
- **Fix**: Update `Tabs` to preserve all active URL search parameters (`useSearchParams().toString()`) when generating subpage tab links, and apply Next.js view transitions or smooth client navigation state preservation.

---

### Content & Microcopy — Unclarified Metrics & Missing Tooltips in KPI Summary

- **Severity**: Major
- **Where**: `app/(pages)/analytics/components/kpi-summary.tsx` (lines 21–93)
- **Persona affected**: Sam (First-time user & career switcher)
- **Problem**: Metric cards like "Resume Pass Rate" (`25.0%`) and "Interview Conversion" (`0.0%`) display raw percentages without contextual benchmarks, target industry ranges, or tooltips explaining the calculation formula (e.g., `Interviews / Total Applications` vs `Offers / Interviews`). Users cannot easily discern whether a metric reflects strong or weak performance.
- **Fix**: Add info icon tooltips (`<HelpCircle>`) on each KPI card title with explicit formulas and target benchmark callouts (e.g., "Industry Benchmark: 15–25%").

---

### Responsive Design — Platform ROI Dashboard Mobile Overflow

- **Severity**: Major
- **Where**: `app/(pages)/analytics/components/platform-roi-dashboard.tsx`
- **Persona affected**: Alex (accessing analytics on mobile viewport < 640px)
- **Problem**: On mobile screens (< 640px), the multi-column data table for Platform ROI overflows horizontally without scroll indicators or card fallback. Columns for Conversion Rate, Offer Yield, and Average Response Days get truncated or pushed off-screen.
- **Fix**: Add a responsive breakpoint fallback rendering a mobile card list on `< sm` viewports while preserving table view on `≥ md` viewports, matching the responsive design pattern used in `data-table-mobile-card.tsx`.

---

### Task-Flow Friction — Misleading Empty State when Filters Yield Zero Results

- **Severity**: Major
- **Where**: `app/(pages)/analytics/status-per-platform/page.tsx` (lines 30–41)
- **Persona affected**: Alex (filtering by a specific month with no applications recorded)
- **Problem**: When a user selects a month/year filter that yields 0 records on the Platform ROI page, the page renders a generic "No applications found. Add your job applications..." card and hides the filter bar entirely. This misleads the user into thinking no applications exist at all, and locks them out of resetting the filter.
- **Fix**: Ensure `AnalyticsFilter` toolbar is ALWAYS rendered regardless of data count. Update empty state text to distinguish between "No applications in selected timeframe" (with a "Clear Filters" button) versus true zero applications.

---

### Accessibility — Inconsistent Heading Hierarchy Across Analytics Cards

- **Severity**: Minor
- **Where**: `app/(pages)/analytics/overview/page.tsx` (lines 109, 126, 140) & card components
- **Persona affected**: Alex (screen reader user navigating by headings `H1`–`H6`)
- **Problem**: Main section headers use `<h2 className="text-sm font-bold uppercase...">`, while nested individual card titles inside those sections use `<CardTitle className="text-base font-bold">` (which renders `<div>` or `<h3>`), causing erratic heading depth jumps in screen reader document outlines.
- **Fix**: Standardize card titles inside sections to `<h3>` elements with consistent text sizing and ARIA landmark structure.

---

### Interaction & Affordance — Filter Reset Touch Target Size

- **Severity**: Minor
- **Where**: `app/(pages)/analytics/components/analytics-filter.tsx` (lines 108–116)
- **Persona affected**: Alex (mobile touch user)
- **Problem**: The "Reset" filter button has an explicit height of `h-8` (32px), falling short of the recommended 44×44px minimum touch target for mobile interfaces, leading to accidental mis-taps.
- **Fix**: Increase touch padding (`min-h-[44px]` or `py-2`) on mobile viewports while keeping compact inline height on desktop (`sm:h-8`).

---

### Perceived Performance — Missing Loading Skeletons on Filter State Changes

- **Severity**: Minor
- **Where**: `app/(pages)/analytics/overview/page.tsx` (lines 96–103) & child cards
- **Persona affected**: Sam (on slow mobile connection)
- **Problem**: Selecting a new month or year filter triggers a server component re-render. During data fetching, child cards display static stale content or briefly freeze without an overlay loading indicator or skeleton pulse state.
- **Fix**: Wrap analytics card sections in React `useTransition` / `Suspense` boundaries displaying subtle Skeleton loader cards during query refetches.
