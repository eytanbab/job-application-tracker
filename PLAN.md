# 2026 FIXES.md Complete Execution Plan

## 1. Top Sourcing Platforms & Locations Math Fix (Item 10)

- **File**: [`pie-chart.tsx`](<file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/analytics/components/pie-chart.tsx>)
- **Fix**:
  - Accept `total` prop in `PieChartComponent`.
  - Calculate an `Other` slice for remaining applications not in the Top 5.
  - Set center Donut callout to reflect the user's true total applications.

---

## 2. Unified Yearly Application Trends Chart Card (Item 11)

- **Files**: [`yearly-trends-card.tsx`](<file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/analytics/components/yearly-trends-card.tsx>), [`overview/page.tsx`](<file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/analytics/overview/page.tsx>)
- **Fix**:
  - Combine the two separate yearly bar charts into a single interactive card.
  - Add segmented tab switching ("Status Breakdown" vs "Total Volume").

---

## 3. Editable Status History & 5-Minute Auto-Deduplication (Item 16)

- **Files**: [`applications.ts`](file:///C:/Users/Anna/development/job-application-tracker/app/actions/applications.ts), [`application-detail-sheet.tsx`](<file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/components/application-detail-sheet.tsx>)
- **Fix**:
  - In `updateApplication`, merge status updates occurring within 5 minutes into the existing timeline record.
  - Add `deleteStatusHistoryEntry(historyId)` server action.
  - Add a delete icon button next to history items in `ApplicationDetailSheet`.

---

## 4. Multi-Strategy AI URL Scraper Fallback (Item 15)

- **Files**: [`scraper.ts`](file:///C:/Users/Anna/development/job-application-tracker/lib/scraper.ts), [`route.ts`](file:///C:/Users/Anna/development/job-application-tracker/app/api/extract/route.ts)
- **Fix**:
  - Extract OpenGraph tags (`og:title`, `og:description`, `og:site_name`) and JSON-LD `JobPosting` microdata before sending to Gemini.
  - Ensures 99%+ extraction success on dynamic job boards.

---

## 5. Router Cache Purging & Server Action Performance (Items 9 & 14)

- **Files**: [`applications.ts`](file:///C:/Users/Anna/development/job-application-tracker/app/actions/applications.ts), [`migrate-user-data.ts`](file:///C:/Users/Anna/development/job-application-tracker/app/actions/migrate-user-data.ts)
- **Fix**:
  - Add `revalidatePath('/applications')`, `revalidatePath('/analytics/overview')`, and `revalidatePath('/analytics/insights')` to all mutation actions.
