# UX Audit — Analytics Suite (`/analytics`)

> **Verdict:** The analytics suite provides a comprehensive, responsive job search intelligence dashboard with thoughtful progressive diagnostics and seamless cross-tab filter preservation. However, critical contradictions in channel yield ranking, missing data chart legends, and WCAG AA contrast/labeling violations create confusion and undermine user trust. Aligning telemetry logic across subpages and applying quick accessibility fixes will elevate the analytics experience from adequate to high-polish.

| | |
| :--- | :--- |
| **Date** | 2026-10-12 |
| **Scope** | Analytics Suite: 3 views (Overview, Platform ROI, Strategic Insights), 18 files ([details](#files-reviewed)) |
| **Mode** | Source-only |
| **Personas** | Alex (Mid-Senior Software Engineer), Sam (Junior Career Transitioner), Taylor (Screen Reader & Keyboard User) ([details](#personas)) |
| **Previous audit** | 2026-08-17 (`2026-08-17-analytics-overview-2.md`) |

---

## Scorecard

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| Visual design & craft | 3 | Clean visual grid and card architecture, but light mode status colors (`amber-600`, `emerald-600`) fail WCAG 2.2 AA contrast. |
| Content & clarity | 4 | Clear coaching copy and diagnostic banners, though empty denominators present misleading 0.0% failure rates. |
| Interaction & flow | 3 | Cross-tab filter sync works smoothly, but Platform Yield leaderboard ranks by volume rather than yield, and stacked charts lack legends. |
| Feedback & trust | 3 | Coaching recommendations contradict between Overview and Platform ROI subpages due to diverging volume thresholds. |
| Accessibility | 3 | Clean semantic container roles, but filter select triggers lack accessible names and segmented bars misuse progressbar semantics. |
| Platform fit | 4 | Good desktop density and tablet grids, but mobile touch targets on select triggers and company badges drop below 24px/44px minimums. |

*1 Broken · 2 Poor · 3 Adequate · 4 Good · 5 Excellent · — Not evaluable in this mode. Scores follow the rubric, so they can be compared across audits.*

---

## What's Working

- **Preserved URL Search Param Filter State Across Tabs**: The [`Tabs`](../../app/_components/tabs.tsx#L28-L30) navigation component seamlessly carries active filter parameters (`?month=X&year=Y`) across Overview, Platform ROI, and Strategic Insights. Users do not lose their temporal filter context when switching between analytical perspectives.
- **Progressive Funnel Bottleneck Logic**: The [`FunnelBottleneckCard`](../../app/(pages)/analytics/components/funnel-bottleneck-card.tsx#L14) and its corresponding server action [`getFunnelBottleneckInsight`](../../app/actions/analytics.ts#L713-L737) elegantly handle the cold-start curve, transitioning from "Pipeline Awaiting Applications" (0 apps) to "Gathering Data" (<5 apps) before evaluating statistical benchmarks (15% resume pass rate, 20% interview conversion).
- **Dual Visual Presentation Modes on Platform ROI**: [`PlatformRoiDashboard`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx#L528-L562) provides both a card grid and a dense, scannable data table with multi-metric sorting (Volume, Interview Rate, Response Rate, Name), allowing users to switch between visual summaries and structured data analysis.
- **Contextual Help Popovers with Clear Benchmark Targets**: [`KpiSummary`](../../app/(pages)/analytics/components/kpi-summary.tsx#L41-L188) equips each metric card with an accessible `<Popover>` explaining formula definitions and industry target benchmarks (e.g., "15.0% – 25.0% typical pass rate", "10 – 20 concurrent active applications").

---

## Top Priorities

1. **Fix Inverted Yield Leaderboard Ranking**: Correct [`getPlatformRoi`](../../app/(pages)/analytics/insights/actions.ts#L50) to sort by interview conversion yield rate rather than raw application volume, ensuring platforms badged with `#1` and `#2` genuinely represent the highest-converting channels. Resolves [`[DATA-01]`](#data-01-platform-yield-leaderboard-sorts-by-application-volume-instead-of-conversion-yield-rate). Effort: ⚡ Quick Win.
2. **Add Visible Legend to Trends Stacked Bar Chart**: Introduce a visible legend or color swatch key in [`StatusesPerYearBarChart`](../../app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx#L114) so sighted and mobile touch users can identify which status corresponds to which bar segment without relying on hover tooltips. Resolves [`[DATA-02]`](#data-02-stacked-bar-chart-in-yearly-trends-lacks-legend-and-accessible-series-labels). Effort: ⚡ Quick Win.
3. **Elevate Low-Contrast Badge & Warning Text to WCAG 2.2 AA**: Replace `text-amber-600` (3.19:1) and `text-emerald-600` (3.66:1) with `text-amber-700` (5.05:1) and `text-emerald-700` (5.36:1) in [`GhostingRiskCard`](../../app/(pages)/analytics/components/ghosting-risk-card.tsx#L80) and [`BestPlatformsCard`](../../app/(pages)/analytics/components/best-platforms-card.tsx#L59) to restore legibility for low-vision and outdoor users. Resolves [`[COLOR-01]`](#color-01-amber-and-emerald-status-badge-text-fails-wcag-22-aa-contrast-requirements-on-light-backgrounds). Effort: ⚡ Quick Win.

---

## Themes

### Theme A: Inconsistent Telemetry & Ranking Logic Across Subviews
Different analytics views define and compute identical concepts inconsistently—ranking "yield" by application volume ([`DATA-01`](#data-01-platform-yield-leaderboard-sorts-by-application-volume-instead-of-conversion-yield-rate)), applying mismatched minimum sample size thresholds for "Best Platform" between Overview and Platform ROI ([`TRUST-01`](#trust-01-discrepancy-in-top-platform-qualification-thresholds-between-overview-and-platform-roi-subpages)), and using divergent definitions of "Ghosting" between Overview and Strategic Insights ([`TRUST-02`](#trust-02-black-hole-breakdown-defines-ghosting-differently-than-overview-radar-and-ignores-non-category-statuses)).
- **Findings**: `[DATA-01]`, `[TRUST-01]`, `[TRUST-02]`
- **Systemic fix**: Centralize analytical business logic in shared helper utilities in `app/actions/analytics.ts` so that qualification thresholds, date-based ghosting calculations, and sorting rules are identically applied across Overview, Platform ROI, and Insights.

### Theme B: Incomplete Visual & Semantic Affordances for Multi-Device and Assistive Access
Data series lack visual keys on touch devices ([`DATA-02`](#data-02-stacked-bar-chart-in-yearly-trends-lacks-legend-and-accessible-series-labels)), filter select triggers lack accessible names ([`A11Y-01`](#a11y-01-analyticsfilter-selecttriggers-lack-accessible-names-and-programmatic-label-associations)), segmented progress bars announce misleading 100% completion ([`A11Y-02`](#a11y-02-platformroidashboard-progressbar-role-misrepresents-pipeline-distribution-as-100-completed-progress)), and touch targets drop below mobile standards ([`AFFORD-01`](#afford-01-select-triggers-and-company-pill-links-violate-minimum-mobile-touch-target-standards)).
- **Findings**: `[DATA-02]`, `[A11Y-01]`, `[COLOR-01]`, `[AFFORD-01]`, `[A11Y-02]`, `[A11Y-03]`
- **Systemic fix**: Audit analytics UI primitives against WCAG 2.2 AA token standards: ensure all charts render responsive legends, enforce minimum 44px/24px touch targets on mobile viewports, and apply verified accessible contrast tokens (`emerald-700`, `amber-700`).

---

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `[DATA-01]` Inverted Yield Leaderboard Sort | `[TRUST-02]` Divergent Ghosting Calculation | `[PERS-01]` View Mode State Reset |
| `[DATA-02]` Missing Legend on Trends Chart | `[A11Y-02]` Misleading ProgressBar ARIA | `[A11Y-03]` Static Legend TabIndex Zero |
| `[COLOR-01]` Low Text Contrast on Badges | `[STATE-01]` 0.0% Division by Zero Fallback | `[HIER-01]` Missing Visible Page Headings |
| `[A11Y-01]` Unlabelled Filter SelectTriggers | `[AFFORD-01]` Mobile Sub-24px Touch Targets | |
| `[TRUST-01]` Conflicting Top Platform Logic | | |

**At a glance:** 🔴 0 Critical · 🟠 5 High · 🟡 4 Medium · 🔵 3 Low · ⚡ 11 Quick Wins · 0 to verify

---

## Resolved Since Last Audit

*(Verified against recommendations from `2026-08-17-analytics-overview-2.md`)*

- **Replaced Negative Rejection KPI with Active Pipeline Load**: Verified resolved in [`app/(pages)/analytics/components/kpi-summary.tsx:35`](../../app/(pages)/analytics/components/kpi-summary.tsx#L35). The negative "Total Rejection Rate" card was replaced with "Active Pipeline", surfacing real-time counts across Applied, Review, and Interview stages.
- **Defaulted Yearly Trends Tab to Application Velocity**: Verified resolved in [`app/(pages)/analytics/components/yearly-trends-card.tsx:54`](../../app/(pages)/analytics/components/yearly-trends-card.tsx#L54). The default view was set to `"volume"` ("Total Volume"), eliminating the side-by-side status redundancy with the adjacent donut chart.
- **Added 7–14 Day Follow-Up Window to Coaching Radar**: Verified resolved in [`app/(pages)/analytics/components/ghosting-risk-card.tsx:49-74`](../../app/(pages)/analytics/components/ghosting-risk-card.tsx#L49-L74). The radar card now actively identifies applications in the optimal 7–14 day follow-up window.
- **Added Direct Navigation Bridge from Overview to Platform ROI**: Verified resolved in [`app/(pages)/analytics/components/best-platforms-card.tsx:77-82`](../../app/(pages)/analytics/components/best-platforms-card.tsx#L77-L82). The card now provides a deep link passing active filter params directly to `/analytics/status-per-platform`.

---

## Findings

| ID | Finding | Severity | Confidence | Effort | Priority | Theme |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `[DATA-01]` | Platform Yield Leaderboard sorts by application volume instead of conversion yield rate | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | A |
| `[DATA-02]` | Stacked bar chart in Yearly Trends lacks legend and accessible series labels | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | B |
| `[COLOR-01]` | Amber and emerald status badge text fails WCAG 2.2 AA contrast requirements on light backgrounds | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | B |
| `[A11Y-01]` | AnalyticsFilter SelectTriggers lack accessible names and programmatic label associations | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | B |
| `[TRUST-01]` | Discrepancy in Top Platform qualification thresholds between Overview and Platform ROI subpages | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | A |
| `[TRUST-02]` | Black Hole Breakdown defines ghosting differently than Overview Radar and ignores non-category statuses | 🟡 Medium | Code-confirmed | Low | Next | A |
| `[A11Y-02]` | PlatformRoiDashboard progressBar role misrepresents pipeline distribution as 100% completed progress | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Next | B |
| `[STATE-01]` | KPI cards display misleading 0.0% failure rates when denominator has zero applications or interviews | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Next | — |
| `[AFFORD-01]` | Select triggers and company pill links violate minimum mobile touch target standards | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Next | B |
| `[PERS-01]` | Platform ROI dashboard view mode and sort criteria reset on tab change or refresh | 🔵 Low | Code-confirmed | ⚡ Quick Win | Later | — |
| `[A11Y-03]` | Static donut chart legend list items have interactive tabIndex=0 causing tab stop fatigue | 🔵 Low | Code-confirmed | ⚡ Quick Win | Later | B |
| `[HIER-01]` | Analytics pages lack visible top-level heading anchors for visual orientation | 🔵 Low | Code-confirmed | ⚡ Quick Win | Later | — |

---

### `[DATA-01]` Platform Yield Leaderboard sorts by application volume instead of conversion yield rate

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. Line 50 of `getPlatformRoi` sorts by `b.total - a.total` instead of `b.yieldRate - a.yieldRate`.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: A
- **Location**: [`app/(pages)/analytics/insights/actions.ts:50`](../../app/(pages)/analytics/insights/actions.ts#L50)
- **Persona**: **Alex** (Applicant optimizing application time): Alex inspects the card titled *"Platform Interview Yield Leaderboard: Highest interview conversion rate platforms for the selected timeframe"* and sees `#1 LinkedIn (2.0% yield)` ahead of `#2 Wellfound (40.0% yield)`. Because the query sorts by `total` volume, the badged ordinal rankings (`#1`, `#2`) are inverted, leading Alex to prioritize a low-yield platform.

**Problem.** A leaderboard badged with ranked positions (`#1`, `#2`) and titled *"Highest interview conversion rate platforms"* must order by conversion efficiency (`yieldRate`), not raw volume. Sorting by volume inverts the core intelligence of a yield leaderboard, violating heuristic consistency (Nielsen #2 Match between system and real world).

**Recommendation.** Sort primarily by `b.yieldRate - a.yieldRate`, using `total` as a tie-breaker. Optionally enforce a minimum volume threshold (`total >= 2`) so single-application outliers don't skew rankings:

```diff
--- a/app/(pages)/analytics/insights/actions.ts
+++ b/app/(pages)/analytics/insights/actions.ts
@@ -48,7 +48,7 @@ export async function getPlatformRoi(month?: string, year?: string) {
             stats.total > 0 ? (stats.interviews / stats.total) * 100 : 0,
         }))
-        .sort((a, b) => b.total - a.total)
+        .sort((a, b) => b.yieldRate - a.yieldRate || b.total - a.total)
         .slice(0, 5);
     },
```

**Acceptance criteria**
- [ ] Platforms in the Strategic Insights yield leaderboard are sorted descending by `yieldRate`.
- [ ] If two platforms share identical yield rates, the platform with higher total application volume ranks higher.

---

### `[DATA-02]` Stacked bar chart in Yearly Trends lacks legend and accessible series labels

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. `StatusesPerYearBarChart` renders stacked `<Bar>` elements with no `<Legend>` or visible label indicators.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx:114`](../../app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx#L114)
- **Persona**: **Sam** (Reviewing monthly pipeline status) & **Alex** (Using mobile browser): Sam looks at the stacked bar chart in Yearly Trends and sees purple, cyan, emerald, amber, and rose bar segments. Because there is no visible legend, Sam cannot tell which color is "Interview" vs "In Review" vs "Rejected" without hovering with a mouse pointer. On a touchscreen phone, mouse hover does not exist, making the chart indecipherable.

**Problem.** Violates WCAG 1.3.1 (Info and Relationships) and Nielsen Heuristic #10 (Recognition over recall). Multi-series data visualizations must include a visible legend. Tooltips requiring hover are completely inaccessible on mobile touch screens.

**Recommendation.** Add a compact horizontal status legend below or above the chart container:

```diff
--- a/app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx
+++ b/app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx
@@ -124,6 +124,19 @@ export function StatusesPerYearBarChart({
           )}
         </BarChart>
       </ChartContainer>
+      <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] text-muted-foreground">
+        {Object.keys(chartData[0] || {})
+          .filter((k) => k !== "month")
+          .map((status) => (
+            <div key={status} className="flex items-center gap-1.5 capitalize">
+              <span
+                className="h-2 w-2 rounded-full shrink-0"
+                style={{ backgroundColor: getColor(status) }}
+              />
+              <span>{statusLabels[getStatusKind(status)] || status}</span>
+            </div>
+          ))}
+      </div>
     </div>
   );
```

**Acceptance criteria**
- [ ] A visible color-coded legend renders below the stacked bar chart.
- [ ] Touchscreen users can identify each status color without relying on hover tooltips.

---

### `[COLOR-01]` Amber and emerald status badge text fails WCAG 2.2 AA contrast requirements on light backgrounds

- **Severity**: 🟠 High (*Impedes × Common*)
- **Confidence**: Code-confirmed and measured with `contrast.js`: `tw:amber-600` on `#ffffff` is 3.19:1; `tw:emerald-600` on `#ffffff` is 3.66:1.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/ghosting-risk-card.tsx:80`](../../app/(pages)/analytics/components/ghosting-risk-card.tsx#L80), [`app/(pages)/analytics/components/best-platforms-card.tsx:59`](../../app/(pages)/analytics/components/best-platforms-card.tsx#L59)
- **Persona**: **Taylor** (Low-vision user) & **Alex** (Viewing device in high ambient glare): Taylor and Alex struggle to read badge numbers and warning alerts because `text-amber-600` and `text-emerald-600` washed out against light card backgrounds.

**Problem.** Non-conformance with WCAG 2.2 Criterion 1.4.3 (Contrast Minimum, Level AA, 4.5:1 for normal text). `tw:amber-600` (`#e17100`) achieves only 3.19:1, and `tw:emerald-600` (`#009966`) achieves only 3.66:1 against `#ffffff`.

**Recommendation.** Shift to shade 700 tokens for light mode (`amber-700` = 5.05:1, `emerald-700` = 5.36:1, both passing AA), while retaining shade 400 for dark mode:

```diff
--- a/app/(pages)/analytics/components/ghosting-risk-card.tsx
+++ b/app/(pages)/analytics/components/ghosting-risk-card.tsx
@@ -80,1 +80,1 @@
-                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
+                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
@@ -93,1 +93,1 @@
-                        className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
+                        className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
--- a/app/(pages)/analytics/components/best-platforms-card.tsx
+++ b/app/(pages)/analytics/components/best-platforms-card.tsx
@@ -59,1 +59,1 @@
-              <span className="mb-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
+              <span className="mb-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
```

**Acceptance criteria**
- [ ] All amber warning text and emerald badge text achieve at least 4.5:1 contrast against white backgrounds in light mode.
- [ ] Dark mode contrast remains >= 4.5:1 using `dark:text-amber-400` and `dark:text-emerald-400`.

---

### `[A11Y-01]` AnalyticsFilter SelectTriggers lack accessible names and programmatic label associations

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. Lines 83 and 106 render `<SelectTrigger>` without `aria-label`, `aria-labelledby`, or `<label htmlFor>`.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/analytics-filter.tsx:83`](../../app/(pages)/analytics/components/analytics-filter.tsx#L83), [`app/(pages)/analytics/components/analytics-filter.tsx:106`](../../app/(pages)/analytics/components/analytics-filter.tsx#L106)
- **Persona**: **Taylor** (Screen reader user): Taylor tabs to the Month filter and hears *"All Months, button, collapsed"*. Tabbing to the Year filter announces *"All Years, button, collapsed"*. Because visual labels are unassociated `<span>` elements, assistive technology cannot announce the purpose of each control.

**Problem.** Non-conformance with WCAG 2.2 Criteria 4.1.2 (Name, Role, Value) and 1.3.1 (Info and Relationships). Form controls must have programmatically determined accessible names.

**Recommendation.** Add explicit `aria-label` attributes to the triggers:

```diff
--- a/app/(pages)/analytics/components/analytics-filter.tsx
+++ b/app/(pages)/analytics/components/analytics-filter.tsx
@@ -83,3 +83,3 @@
-            <SelectTrigger className="w-[140px] h-8 text-xs">
+            <SelectTrigger aria-label="Filter by month" className="w-[140px] h-8 text-xs">
               <SelectValue placeholder="All Months" />
             </SelectTrigger>
@@ -106,3 +106,3 @@
-            <SelectTrigger className="w-[110px] h-8 text-xs">
+            <SelectTrigger aria-label="Filter by year" className="w-[110px] h-8 text-xs">
               <SelectValue placeholder="All Years" />
             </SelectTrigger>
```

**Acceptance criteria**
- [ ] Screen readers announce "Filter by month" and "Filter by year" when focus reaches each filter trigger.

---

### `[TRUST-01]` Discrepancy in Top Platform qualification thresholds between Overview and Platform ROI subpages

- **Severity**: 🟠 High (*Impedes × Common*)
- **Confidence**: Code-confirmed. `getBestPlatformInsight` in `analytics.ts:851` has no minimum volume threshold (`total >= 1`), whereas `PlatformRoiDashboard:392` enforces `interviewCount > 0 && total >= 2`.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: A
- **Location**: [`app/actions/analytics.ts:851`](../../app/actions/analytics.ts#L851) vs [`app/(pages)/analytics/components/platform-roi-dashboard.tsx:392`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx#L392)
- **Persona**: **Alex** (Cross-checking application data): Alex has 1 application on Otta with 1 interview (100% yield, n=1) and 40 applications on LinkedIn with 9 interviews (22.5% yield, n=40). Overview tells Alex: *"Best Performing Platform: Otta (100.0% rate). Focus there."* Alex clicks "View Platform ROI →" where the highlight banner reports: *"Top Interview Channel: LinkedIn (22.5% rate)"*. The conflicting advice creates distrust.

**Problem.** Inconsistent qualification logic across connected views violates Nielsen Heuristic #4 (Consistency and Standards). Overview allows single-application outliers to hijack strategic coaching, while Platform ROI enforces a sample size threshold.

**Recommendation.** Enforce `p.total >= 2` in `getBestPlatformInsight`, and surface the sample size in `BestPlatformsCard` (e.g., "1 interview from 2 applications"). If only 1 application exists, display an informative state: "Sample size too small (<2 applications) for reliable ranking":

```diff
--- a/app/actions/analytics.ts
+++ b/app/actions/analytics.ts
@@ -849,3 +849,5 @@ export async function getBestPlatformInsight(month?: string, year?: string) {
+      const qualified = platformsWithRates.filter((p) => p.total >= 2);
+      const bestPlatform = qualified.length > 0 ? qualified[0] : platformsWithRates[0] || null;
+      const secondBest = qualified.length > 1 ? qualified[1] : null;
```

**Acceptance criteria**
- [ ] Overview's Best Platform coaching card and Platform ROI's highlight banner recommend the identical platform for any given dataset.
- [ ] Single-application entries do not claim 100% conversion superiority without sample size context.

---

### `[TRUST-02]` Black Hole Breakdown defines ghosting differently than Overview Radar and ignores non-category statuses

- **Severity**: 🟡 Medium (*Distracts × Common*)
- **Confidence**: Code-confirmed. `getBlackHoleBreakdown` in `insights/actions.ts:84` only filters `statusCategory === "ghosted"`, whereas Overview's `getGhostedApplications` calculates ghosting dynamically based on `daysAgo >= 30`.
- **Effort**: Low · **Priority**: Next · **Theme**: A
- **Location**: [`app/(pages)/analytics/insights/actions.ts:84`](../../app/(pages)/analytics/insights/actions.ts#L84)
- **Persona**: **Alex** & **Sam**: Alex has 10 applications in "Applied" status older than 35 days. On `/analytics/overview`, the Radar card reports *"10 Stale / Ghosted (>30d)"*. On `/analytics/insights`, the card labeled *"Ghosted (30+ Days)"* reports `0 (0.0%)` because the applications were never manually reassigned to status category "ghosted".

**Problem.** Divergent definitions of the same user metric across pages damage credibility and create confusion about pipeline status.

**Recommendation.** In `getBlackHoleBreakdown`, incorporate elapsed days (`differenceInDays(now, appliedDate) >= 30` for active applications), aligning with `getGhostedApplications`.

**Acceptance criteria**
- [ ] Number of ghosted applications reported on Strategic Insights matches the count reported on Overview for identical filter parameters.

---

### `[A11Y-02]` PlatformRoiDashboard progressBar role misrepresents pipeline distribution as 100% completed progress

- **Severity**: 🟡 Medium (*Distracts × Core*)
- **Confidence**: Code-confirmed. `platform-roi-dashboard.tsx:149, 277` sets `role="progressbar"` with `aria-valuenow={platform.total}` and `aria-valuemax={platform.total}`.
- **Effort**: ⚡ Quick Win · **Priority**: Next · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/platform-roi-dashboard.tsx:149`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx#L149), [`app/(pages)/analytics/components/platform-roi-dashboard.tsx:277`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx#L277)
- **Persona**: **Taylor** (Screen reader user): Moving through platform cards, the screen reader announces: *"Pipeline breakdown for LinkedIn: 20 total, progress bar, 100%"*. Taylor assumes all LinkedIn applications are finished, whereas 20 is merely the total application count distributed across stages.

**Problem.** Violates WCAG 4.1.2 (Name, Role, Value). A multi-stage distribution graphic is not a single completion task. Announcing `valuenow == valuemax` conveys 100% task completion.

**Recommendation.** Replace `role="progressbar"` with `role="img"` and provide a comprehensive distribution description in `aria-label`:

```diff
--- a/app/(pages)/analytics/components/platform-roi-dashboard.tsx
+++ b/app/(pages)/analytics/components/platform-roi-dashboard.tsx
@@ -149,5 +149,2 @@
-            role="progressbar"
-            aria-label={`Pipeline breakdown for ${platform.platformName}: ${platform.total} total`}
-            aria-valuenow={platform.total}
-            aria-valuemin={0}
-            aria-valuemax={platform.total}
+            role="img"
+            aria-label={`Pipeline breakdown for ${platform.platformName}: ${platform.statuses.map((s) => `${s.value} ${s.status}`).join(", ")}`}
```

**Acceptance criteria**
- [ ] Screen readers announce the breakdown of applications by stage rather than "100% progress".

---

### `[STATE-01]` KPI cards display misleading 0.0% failure rates when denominator has zero applications or interviews

- **Severity**: 🟡 Medium (*Distracts × Common*)
- **Confidence**: Code-confirmed. `KpiSummary` formats `interviewRate` and `interviewConversionRate` as `0.0%` even when `totalApplications === 0` or `stages.interview === 0`.
- **Effort**: ⚡ Quick Win · **Priority**: Next
- **Location**: [`app/(pages)/analytics/components/kpi-summary.tsx:114`](../../app/(pages)/analytics/components/kpi-summary.tsx#L114), [`app/(pages)/analytics/components/kpi-summary.tsx:153`](../../app/(pages)/analytics/components/kpi-summary.tsx#L153)
- **Persona**: **Sam** (New tracker user): Sam tracks their first 2 applications and checks the overview page. Both "Resume Pass Rate" and "Interview Conversion" display `0.0%`. Sam feels discouraged, assuming their applications failed, when in reality no recruiter response has occurred yet.

**Problem.** Displaying `0.0%` for an empty denominator conflates "no data yet" with "0% success rate", inducing unwarranted applicant anxiety.

**Recommendation.** Return `—` or `N/A` when the denominator is 0:

```diff
--- a/app/(pages)/analytics/components/kpi-summary.tsx
+++ b/app/(pages)/analytics/components/kpi-summary.tsx
@@ -113,3 +113,3 @@ export function KpiSummary({
           <p className="text-3xl font-extrabold text-foreground">
-            {formatPercent(interviewRate)}
+            {totalApplications > 0 ? formatPercent(interviewRate) : "—"}
           </p>
@@ -152,3 +152,3 @@ export function KpiSummary({
           <p className="text-3xl font-extrabold text-foreground">
-            {formatPercent(interviewConversionRate)}
+            {activeStages.interview > 0 ? formatPercent(interviewConversionRate) : "—"}
           </p>
```

**Acceptance criteria**
- [ ] Accounts with 0 applications show `—` instead of `0.0%` for Resume Pass Rate.
- [ ] Applications without interviews show `—` instead of `0.0%` for Interview Conversion.

---

### `[AFFORD-01]` Select triggers and company pill links violate minimum mobile touch target standards

- **Severity**: 🟡 Medium (*Impedes × Edge*)
- **Confidence**: Code-confirmed. `SelectTrigger` in `AnalyticsFilter` (`h-8` = 32px) and `YearlyTrendsCard` (`h-7` = 28px), and company pill links (`text-[10px] px-1.5 py-0.5` = ~19px height) fall below touch guidelines.
- **Effort**: ⚡ Quick Win · **Priority**: Next · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/ghosting-risk-card.tsx:66`](../../app/(pages)/analytics/components/ghosting-risk-card.tsx#L66), [`app/(pages)/analytics/components/analytics-filter.tsx:83`](../../app/(pages)/analytics/components/analytics-filter.tsx#L83)
- **Persona**: **Alex** (Using smartphone on transit): Alex attempts to tap a company pill (`Google →`) in the follow-up list and repeatedly mis-taps the neighboring badge because targets are only 19px high.

**Problem.** Non-conformance with WCAG 2.2 Criterion 2.5.8 (Target Size Minimum, Level AA, 24x24px) and mobile touch conventions (Apple HIG 44pt, Android Material 48dp).

**Recommendation.** Apply `min-h-[38px] sm:min-h-0 sm:h-8` to filter triggers, and add `min-h-[26px] px-2 py-1` to company badge links.

**Acceptance criteria**
- [ ] All interactive buttons, triggers, and badge links maintain at least 24px height on mobile screens.

---

### `[PERS-01]` Platform ROI dashboard view mode and sort criteria reset on tab change or refresh

- **Severity**: 🔵 Low (*Distracts × Edge*)
- **Confidence**: Code-confirmed. `PlatformRoiDashboard` manages `viewMode` and `sortBy` in local component `useState`.
- **Effort**: ⚡ Quick Win · **Priority**: Later
- **Location**: [`app/(pages)/analytics/components/platform-roi-dashboard.tsx:330`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx#L330)
- **Persona**: **Alex** (Power user): Alex switches Platform ROI to Table view and sorts by "Interview Rate". After checking the Overview tab and returning, the view resets to Grid view sorted by Volume.

**Problem.** Ephemeral view state violates user efficiency (Nielsen Heuristic #7). In contrast, the `/applications` table persists its view mode via Nuqs `useQueryState`.

**Recommendation.** Bind `view` and `sort` to URL query params using Nuqs or persist to `localStorage`.

**Acceptance criteria**
- [ ] Navigating between analytics tabs preserves the user's chosen view mode (grid vs table) and sort order.

---

### `[A11Y-03]` Static donut chart legend list items have interactive tabIndex=0 causing tab stop fatigue

- **Severity**: 🔵 Low (*Distracts × Common*)
- **Confidence**: Code-confirmed. Line 168 in `pie-chart.tsx` specifies `tabIndex={0}` on static non-actionable `<li>` elements.
- **Effort**: ⚡ Quick Win · **Priority**: Later · **Theme**: B
- **Location**: [`app/(pages)/analytics/components/pie-chart.tsx:168`](../../app/(pages)/analytics/components/pie-chart.tsx#L168)
- **Persona**: **Taylor** (Keyboard-only user): Tabbing through the Overview page, Taylor is forced to step through 5–7 passive legend items that perform no action on Enter/Space.

**Problem.** Placing static informative items into the sequential tab order creates navigation friction for keyboard-only users.

**Recommendation.** Remove `tabIndex={0}` and focus styling from `<li>`, allowing screen readers to consume the list semantically.

**Acceptance criteria**
- [ ] Pressing Tab bypasses static legend items, moving directly to actionable controls.

---

### `[HIER-01]` Analytics pages lack visible top-level heading anchors for visual orientation

- **Severity**: 🔵 Low (*Polish × Common*)
- **Confidence**: Code-confirmed. All three analytics routes define `h1` with `className="sr-only"`.
- **Effort**: ⚡ Quick Win · **Priority**: Later
- **Location**: [`app/(pages)/analytics/overview/page.tsx:93`](../../app/(pages)/analytics/overview/page.tsx#L93)
- **Persona**: **Sam** & **Alex**: Sighted users landing on the page see the tab navigation bar immediately followed by "Filter Analytics", lacking a prominent page header establishing context.

**Problem.** Weak visual hierarchy and lack of visual page anchor for sighted users.

**Recommendation.** Add an unobtrusive visual section title or include the active route title alongside the tab bar.

**Acceptance criteria**
- [ ] Sighted users see a clear, visible page title orienting them to the current analytics perspective.

---

## Coverage

| Category | Status | Findings |
| :--- | :--- | :--- |
| `HIER` Visual hierarchy & layout | Evaluated | `[HIER-01]` |
| `TYPO` Typography & readability | Evaluated | — |
| `COLOR` Color, contrast & visual cues | Evaluated | `[COLOR-01]` |
| `DSYS` Design system adherence | Evaluated | — |
| `MOTION` Motion & animation | Evaluated | — |
| `COPY` Content, microcopy & clarity | Evaluated | — |
| `STATE` Empty, loading & error states | Evaluated | `[STATE-01]` |
| `I18N` Localization & resilience | Evaluated | — |
| `NAV` Navigation & information architecture | Evaluated | — |
| `AFFORD` Interaction affordance & touch targets | Evaluated | `[AFFORD-01]` |
| `FORM` Forms & input validation | Evaluated | — |
| `FLOW` Task flow continuity & friction | Evaluated | — |
| `COGN` Cognitive load & progressive disclosure | Evaluated | — |
| `SRCH` Search, filtering & sorting | Evaluated | — |
| `DATA` Data display & visualization | Evaluated | `[DATA-01]`, `[DATA-02]` |
| `TRUST` Feedback, confirmation & trust | Evaluated | `[TRUST-01]`, `[TRUST-02]` |
| `A11Y` Accessibility & keyboard operability | Evaluated | `[A11Y-01]`, `[A11Y-02]`, `[A11Y-03]` |
| `PERF` Perceived performance & optimistic UI | Evaluated | — |
| `ETHIC` Dark patterns & ethical design | Evaluated | — |
| `PLAT` Platform-specific conventions | Evaluated | — |
| `ONBD` Onboarding & first-use experience | Evaluated | — |
| `PERS` Personalization & state persistence | Evaluated | `[PERS-01]` |

---

## Appendix

### Personas

- **Alex (Active Job Seeker & Mid-Senior Software Engineer)**: Submits 15–25 applications weekly across LinkedIn, Indeed, Otta, and company career portals. Primary goal is identifying pipeline bottlenecks, monitoring follow-up deadlines (7–14 days), and determining which platform yields the highest interview conversion rate. Navigates on both desktop and mobile viewports.
- **Sam (Career Transitioner & Junior Developer)**: Applying to first tech roles. Easily discouraged by negative metrics (e.g. rejection rates). Relies heavily on benchmark context, clear definitions, and actionable coaching tips to maintain momentum.
- **Taylor (Screen Reader & Keyboard-Only User)**: Navigates exclusively using screen readers (NVDA/VoiceOver) and keyboard shortcuts (Tab, Shift-Tab, Enter, arrows). Highly sensitive to missing ARIA labels, improper progressbar roles, static tab stops, and color contrast failures.

### Walkthrough

| Step | Persona | Question that failed | Finding |
| :--- | :--- | :--- | :--- |
| 1. Filter by timeframe | Taylor (Screen reader) | Will they know what the control does? | `[A11Y-01]` |
| 2. Check early KPI results | Sam (Junior applicant) | Will they understand the outcome? (sees 0.0% with 0 interviews) | `[STATE-01]` |
| 3. Read Monthly Trends Chart | Alex (Mobile user) | Can they interpret the data without hover? | `[DATA-02]` |
| 4. Drill into Best Platform | Alex (Senior applicant) | Does the coaching match the detailed page? | `[TRUST-01]` |
| 5. Review Platform Yield Table | Alex (Senior applicant) | Does the leaderboard match the stated ranking? | `[DATA-01]` |

### Files Reviewed

- [`app/(pages)/analytics/layout.tsx`](../../app/(pages)/analytics/layout.tsx)
- [`app/_components/tabs.tsx`](../../app/_components/tabs.tsx)
- [`app/(pages)/analytics/overview/page.tsx`](../../app/(pages)/analytics/overview/page.tsx)
- [`app/(pages)/analytics/status-per-platform/page.tsx`](../../app/(pages)/analytics/status-per-platform/page.tsx)
- [`app/(pages)/analytics/insights/page.tsx`](../../app/(pages)/analytics/insights/page.tsx)
- [`app/(pages)/analytics/components/analytics-filter.tsx`](../../app/(pages)/analytics/components/analytics-filter.tsx)
- [`app/(pages)/analytics/components/kpi-summary.tsx`](../../app/(pages)/analytics/components/kpi-summary.tsx)
- [`app/(pages)/analytics/components/best-platforms-card.tsx`](../../app/(pages)/analytics/components/best-platforms-card.tsx)
- [`app/(pages)/analytics/components/ghosting-risk-card.tsx`](../../app/(pages)/analytics/components/ghosting-risk-card.tsx)
- [`app/(pages)/analytics/components/funnel-bottleneck-card.tsx`](../../app/(pages)/analytics/components/funnel-bottleneck-card.tsx)
- [`app/(pages)/analytics/components/pie-chart.tsx`](../../app/(pages)/analytics/components/pie-chart.tsx)
- [`app/(pages)/analytics/components/yearly-trends-card.tsx`](../../app/(pages)/analytics/components/yearly-trends-card.tsx)
- [`app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx`](../../app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx)
- [`app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx)
- [`app/(pages)/analytics/components/platform-roi-dashboard.tsx`](../../app/(pages)/analytics/components/platform-roi-dashboard.tsx)
- [`app/(pages)/analytics/components/blackhole-breakdown-card.tsx`](../../app/(pages)/analytics/components/blackhole-breakdown-card.tsx)
- [`app/(pages)/analytics/components/domain-leaderboard-card.tsx`](../../app/(pages)/analytics/components/domain-leaderboard-card.tsx)
- [`app/(pages)/analytics/components/role-targeting-card.tsx`](../../app/(pages)/analytics/components/role-targeting-card.tsx)
- [`app/actions/analytics.ts`](../../app/actions/analytics.ts)
- [`app/(pages)/analytics/insights/actions.ts`](../../app/(pages)/analytics/insights/actions.ts)
- [`lib/utils.ts`](../../lib/utils.ts)

### Method & Evidence

- **Passes**: Task walkthrough, State inventory, Heuristic sweep (all 22 categories), Accessibility conformance (WCAG 2.2 AA), Visual craft review, Content review.
- **Token inventory**: Computed via `token_inventory.js`: 15 emerald-500 usages, 11 emerald-400 usages, 8 emerald-700 usages, 7 amber-500 usages, 3 amber-400 usages, 4 distinct heights on dropdown select triggers (`h-7`, `h-8`, `h-9`, `h-14`).
- **Contrast checks** (computed with `contrast.js`):
  - `tw:amber-600` on `#ffffff`: **3.19:1** (FAILS WCAG AA 4.5:1 for normal text).
  - `tw:amber-700` on `#ffffff`: **5.05:1** (PASSES WCAG AA).
  - `tw:emerald-600` on `#ffffff`: **3.66:1** (FAILS WCAG AA 4.5:1 for normal text).
  - `tw:emerald-700` on `#ffffff`: **5.36:1** (PASSES WCAG AA).
  - `tw:blue-600` on `#ffffff`: **5.25:1** (PASSES WCAG AA).
  - `tw:blue-400` on `#141820` (dark card): **6.74:1** (PASSES WCAG AA).
  - `tw:amber-400` on `#141820` (dark card): **10.35:1** (PASSES WCAG AA).
  - `tw:emerald-400` on `#141820` (dark card): **9.19:1** (PASSES WCAG AA).
- **Checked & cleared**:
  - *Radix Popover focus management*: Verified that popovers in `KpiSummary` properly trap and restore focus and support Esc key closure.
  - *URL query state retention*: Verified that `Tabs` in `_components/tabs.tsx` carries query parameters across all 3 analytics subpages.
  - *Dynamic dark-mode status colors*: Confirmed that `--status-accepted` (`hsl(151, 78%, 37%)`) against dark background has 5.75:1 contrast, satisfying AA.
- **Suppressed**: 0 entries.
