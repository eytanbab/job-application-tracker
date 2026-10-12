# UX Content Audit & Research — Analytics Overview (`/analytics/overview`)

Date: 2026-08-17
Previous audit of this flow: 2026-08-17 (`2026-08-17-analytics-overview.md`)
Audit mode: Source-only (Deep Content & Information Architecture Research)
Screenshots: none
Personas used:
- Alex: Active Job Seeker & Software Engineer tracking 50+ applications across platforms, looking for quick pipeline health, bottleneck diagnostics, follow-up alerts, and high-ROI channels.
- Sam: Career Switcher & First-Time Tracker User needing clear metric explanations, motivational velocity indicators, benchmark comparisons, and frictionless navigation.
Files reviewed:
- `app/(pages)/analytics/overview/page.tsx`
- `app/(pages)/analytics/overview/actions.ts` (dead code analysis)
- `app/(pages)/analytics/components/kpi-summary.tsx`
- `app/(pages)/analytics/components/best-platforms-card.tsx`
- `app/(pages)/analytics/components/ghosting-risk-card.tsx`
- `app/(pages)/analytics/components/domain-leaderboard-card.tsx`
- `app/(pages)/analytics/components/pie-chart.tsx`
- `app/(pages)/analytics/components/yearly-trends-card.tsx`
- `app/(pages)/analytics/components/statuses-per-year-bar-chart.tsx`
- `app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx`
- `app/(pages)/analytics/status-per-platform/page.tsx` (cross-page redundancy analysis)
- `app/(pages)/analytics/insights/page.tsx` (cross-page redundancy analysis)
- `app/actions/analytics.ts`
- `app/db/schema.ts`
Categories checked:
- Content & microcopy
- Information density & cognitive load
- Duplicate & redundant UI elements
- Missing content & actionable data
- Data display & visualization
- Navigation & information architecture
- Visual hierarchy & layout
- Accessibility (no issues found with existing structure)
- Color & contrast (no issues found with existing structure)

---

## Executive Summary

This research and content-focused UX audit examines the information architecture, cognitive utility, and data relevance of `/analytics/overview`. 

While the layout is visually clean and accessible, the content suffers from three core architectural issues:
1. **Absence of Operational Pipeline Health**: The top KPI row focuses exclusively on outcome percentages (Pass Rate, Conversion Rate, Rejection Rate, Response Days), omitting the primary daily operational question: *"How many active applications are currently in flight?"* (`breakdown.active` is calculated in the database query but discarded in the UI).
2. **Triplicate Cross-Page Redundancy**: Platform ROI data is presented in three separate locations with overlapping metrics (`BestPlatformsCard` on Overview, full dashboard on `/analytics/status-per-platform`, and `PlatformRoiDashboard` leaderboard on `/analytics/insights`), creating fragmentation.
3. **Misplaced Secondary Telemetry**: ATS Domain Performance (`myworkdayjobs.com`, `greenhouse.io`) takes up 1/3 of the primary Coaching section on Overview despite being low-actionability technical metadata that belongs on Strategic Insights.

Total content findings: **0 Critical**, **5 Major**, and **4 Minor**.

---

## Research Matrix: Content Value vs. Actionability

| Screen Element | Current Content | Actionability for Job Seeker | Value Assessment | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **KPI: Resume Pass Rate** | % of apps reaching interview | High (diagnoses resume/keyword effectiveness) | **Keep & Enhance** | Add inline benchmark health indicator (e.g. "Healthy: 18.5%"). |
| **KPI: Interview Conversion** | % of interviewed apps to offers | High (diagnoses interview performance) | **Keep** | Clarify denominator in subtitle ("Interviews to Offers"). |
| **KPI: Total Rejection Rate** | % of all apps rejected | Low (mathematical inverse of pass rate; negative framing) | **Replace** | Replace with **Active Pipeline Count** (e.g. "14 In Progress" across Applied/Review/Interview). |
| **KPI: Response Velocity** | Average days to first recruiter update | Medium-High (sets expectation on pipeline staleness) | **Keep** | Keep; pair with follow-up timing advice. |
| **Coaching: Best Platform** | Top platform + multiplier | Medium (informs where to invest application time) | **Keep with Link** | Add direct link to `/analytics/status-per-platform` for deep drilldown. |
| **Coaching: Ghosting Risk** | Apps > 30 days old + company tags | High (identifies abandoned applications) | **Keep & Enhance** | Add follow-up alert for 7–14 day window. |
| **Coaching: ATS Domain** | Top ATS domains (Greenhouse, Workday) | Low (job seekers cannot choose ATS of prospective employers) | **Relocate** | Move to `/analytics/insights`; replace on Overview with **Pipeline Funnel Drop-off / Follow-Up Alert**. |
| **Chart: Status Donut** | Slice breakdown of stages | High (visual pipeline distribution) | **Keep** | Retain as primary overview visual. |
| **Chart: Yearly Trends** | Stacked status bar / Total volume | Medium-High (historical velocity) | **Keep & Refine** | Default active tab to **Total Volume** (Application Velocity) to avoid duplicating the donut chart's status breakdown. |

---

## What is Missing from `/analytics/overview`?

### 1. Active Pipeline Volume & Stage Breakdown (Top Missing Operational Metric)
- **Problem**: Job seekers (Alex & Sam) check their overview daily to answer: *"What is active right now?"* All four current KPI cards show percentages or historical averages. The number of applications currently in flight (Active Pipeline: Applied, In Review, Interviewing) is completely missing.
- **Evidence**: `getDetailedApplicationBreakdown()` in `app/actions/analytics.ts` already calculates `activeCount` (`breakdown.active = activeCount`), but `KpiSummary` does not expose it.
- **Impact**: Users must navigate to `/applications` and manually count or filter active jobs just to know their pipeline load.

### 2. Actionable Follow-Up Opportunities (7–14 Day Window)
- **Problem**: The `GhostingRiskCard` only surfaces applications older than 30 days (which are essentially dead). It provides no intelligence on applications in the critical **7–14 day follow-up window** (where sending a polite recruiter nudge has the highest conversion ROI).
- **Impact**: Missed opportunity to make analytics an active co-pilot rather than a post-mortem archive.

### 3. Application Velocity & Weekly Goal Pacing
- **Problem**: Long-term monthly charts do not communicate current weekly momentum (e.g. applications submitted this week vs. target pace of 5–10 apps/week).
- **Impact**: Novice user Sam loses momentum without short-term pacing feedback.

### 4. Direct Bridge from Overview to Detailed Subpages
- **Problem**: Strategy coaching cards lack deep-linking to corresponding subpages (e.g. `BestPlatformsCard` does not link to `/analytics/status-per-platform`).

---

## What is Unnecessary or Redundant on `/analytics/overview`?

### 1. Total Rejection Rate KPI Card (Negative Redundancy)
- **Problem**: Total Rejection Rate is redundant with Resume Pass Rate + Interview Conversion Rate. Presenting a large "72.4% Rejection Rate" in red/rose color adds negative cognitive fatigue without providing any distinct diagnostic insight that Pass Rate does not already provide.
- **Recommendation**: Replace this slot with **Active Pipeline Count** (showing total in flight with a breakdown badge like "8 Applied • 4 Review • 2 Interview").

### 2. ATS Domain Performance on Overview Page (Misplaced Niche Telemetry)
- **Problem**: ATS Domain Performance analyzes root domains like `myworkdayjobs.com`, `greenhouse.io`, and `workable.com`. A job seeker applying to companies has very little control over what ATS the employer uses. Placing this on the primary Overview coaching row dilutes space that should be reserved for high-impact action items (stale follow-ups, interview pipeline bottlenecks).
- **Recommendation**: Move ATS Domain Performance to `/analytics/insights` (under Channel Intelligence) and replace its slot on Overview with a **Pipeline Health & Follow-Up Alert Card**.

### 3. Dual Status Breakdown Chart Redundancy
- **Problem**: On the bottom charts row, the left card is `PieChartComponent` (Status Breakdown Donut). The right card is `YearlyTrendsCard` which defaults to the "Status Breakdown" tab (Stacked Status Bar Chart). This renders status distribution twice side-by-side.
- **Recommendation**: Set `YearlyTrendsCard` default tab to `"volume"` ("Total Volume" / Velocity) so the left chart shows **Status Distribution** and the right chart shows **Application Volume Over Time**.

### 4. Dead Code: `app/(pages)/analytics/overview/actions.ts`
- **Problem**: `app/(pages)/analytics/overview/actions.ts` defines `getOverviewMetrics` and `getApplicationVelocity` which are never imported anywhere in the project (`overview/page.tsx` imports directly from `@/app/actions/analytics`).
- **Recommendation**: Remove the dead actions file to prevent developer confusion.

---

## Detailed Findings

### Content & Language

#### Content & Microcopy — Missing Active Pipeline Metric in KPI Row
Severity: Major
Where: `app/(pages)/analytics/components/kpi-summary.tsx` (lines 26–187) & `app/(pages)/analytics/overview/page.tsx`
Persona affected: Alex & Sam
Problem: The 4 KPI cards only display rate percentages and response velocity in days. There is no card showing the current active pipeline count (applications in Applied, In Review, or Interviewing stages). The raw data is already fetched in `breakdownData.breakdown.active`, but omitted from the UI.
Fix: Replace the "Total Rejection Rate" card (or expand to a 4-card operational layout) with an **Active Pipeline** card displaying `breakdownData.breakdown.active` with stage breakdown pills and a link to `/applications?status=active`.

#### Content & Microcopy — Redundant Negative Rejection Rate Metric
Severity: Major
Where: `app/(pages)/analytics/components/kpi-summary.tsx` (lines 106–143)
Persona affected: Sam (demotivated by high rejection framing)
Problem: "Total Rejection Rate" duplicates the inverse information of "Resume Pass Rate". Because job applications naturally have a 70–90% rejection rate across the market, highlighting total rejections with a prominent red badge creates negative psychological drag without giving actionable guidance.
Fix: Transition the metric from passive rejection counting to active pipeline throughput (e.g. "Active Pipeline" or "Funnel Conversion Velocity").

#### Content & Microcopy — Missing Follow-Up Opportunity Alert
Severity: Major
Where: `app/(pages)/analytics/components/ghosting-risk-card.tsx` & `overview/page.tsx`
Persona affected: Alex (optimizing follow-up cadence)
Problem: The coaching section warns about applications > 30 days old (unrecoverable ghosting), but fails to surface applications 7–14 days old where proactive recruiter follow-up has high conversion leverage.
Fix: Enhance `GhostingRiskCard` or introduce a "Follow-Up Radar" showing applications reaching the 7–14 day mark with one-click search links.

#### Content & Microcopy — Dead Code File `overview/actions.ts`
Severity: Minor
Where: `app/(pages)/analytics/overview/actions.ts`
Persona affected: Human developers & maintainers
Problem: Contains 118 lines of unreferenced server action logic that shadows canonical actions in `app/actions/analytics.ts`.
Fix: Delete `app/(pages)/analytics/overview/actions.ts`.

---

### Interaction & Structure

#### Navigation & Information Architecture — ATS Domain Performance Misplaced on Overview
Severity: Major
Where: `app/(pages)/analytics/overview/page.tsx` (line 133) & `app/(pages)/analytics/components/domain-leaderboard-card.tsx`
Persona affected: Alex & Sam
Problem: ATS domain parsing (`greenhouse.io`, `myworkdayjobs.com`) is technical telemetry rather than executive job search guidance. It occupies prime screen real estate on the Overview coaching row while Strategic Insights is underutilized.
Fix: Relocate `DomainLeaderboardCard` to `/analytics/insights` and introduce a high-actionability coaching card on Overview (such as Pipeline Bottleneck / Follow-up Radar).

#### Navigation & Information Architecture — Redundant Platform ROI Surface Area
Severity: Major
Where: `best-platforms-card.tsx` on Overview, `status-per-platform/page.tsx`, and `insights/page.tsx`
Persona affected: Alex (navigating between fragmented platform metrics)
Problem: Platform ROI metrics are fragmented across three separate pages with slight variations in presentation.
Fix: Add a clear "View Full Platform ROI →" deep link on `BestPlatformsCard` pointing directly to `/analytics/status-per-platform`, consolidating deep platform yield details.

---

### Visual Design

#### Data Display & Visualization — Side-by-Side Status Breakdown Chart Duplication
Severity: Minor
Where: `app/(pages)/analytics/components/yearly-trends-card.tsx` (line 46) & `overview/page.tsx` (line 146)
Persona affected: Sam (scanning charts)
Problem: The left chart is a Status Breakdown donut. The right chart defaults to "Status Breakdown" stacked bars. Presenting two status breakdown charts side-by-side is visually repetitive.
Fix: Change `activeTab` initial state in `YearlyTrendsCard` to `"volume"` so users immediately see Status Distribution (Donut) alongside Application Volume Over Time (Bar Chart).

#### Visual Hierarchy & Layout — Missing Inline Benchmark Ratings on KPI Cards
Severity: Minor
Where: `app/(pages)/analytics/components/kpi-summary.tsx`
Persona affected: Sam (unsure if 18% pass rate is good or bad)
Problem: Target benchmarks are only visible after opening popovers. Users cannot tell at a glance whether their 15% rate meets standard market expectations.
Fix: Add small, subtle status pills directly beneath the percentage (e.g. `18.2%` with a small green badge `On Target (15–25%)`).

#### Content & Microcopy — Unclear KPI Subtitle on Interview Conversion
Severity: Minor
Where: `app/(pages)/analytics/components/kpi-summary.tsx` (lines 99–101)
Persona affected: Sam
Problem: Subtitle reads "Interviews converted to offer leads". In job tracking, accepted offers are the final conversion, not "offer leads".
Fix: Update copy to "Interviews converted to accepted offers".
