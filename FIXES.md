# Job Application Tracker — Resolved Issues & Improvements

## Applications & Forms

- [x] "Quick Update Status" rerenders the form each keystroke when changing custom stage detail (FIXED: Decoupled quick status input state from currentApp and removed currentApp.status from history refetch useEffect dependencies).
- [x] The search functionality in `/applications` does not work properly. For example, searching for a company doesn't show all the results containing this company name.
- [x] Updating the status category does not update the stage details in the edit application form. If a user changes the status category from "Applied" to any other status, the stage details stays on apply.
- [x] On mobile view - Applications page, it is almost impossible to press the "Next" button as the FAB is covering it (FIXED: Added pb-24 bottom clearance to grid container on mobile).
- [x] On mobile view - Applications page, "Rows per page" is overflowing and can be 2-3 lines (FIXED: Reorganized pagination controls into responsive stacked rows on mobile).
- [x] On mobile view - Applications page - Viewing application, the role name is not in the center as it has pr-6 on its parent div (FIXED: Removed asymmetric pr-6 from header flex wrapper).
- [x] On mobile view - Applications page - Viewing application, external link button is too close to the 'X' button (FIXED: Added mr-8 margin to separate action button from modal close button).
- [x] In Applications page - Viewing application, the 'quick update status' can be confusing for users who will not understand why the status shows twice (FIXED: Added explicit Stage Category and Custom Stage Detail labels with contextual placeholders).
- [x] In Applications page - Editing application, the stage details / custom status text size in the input is not in the same size as the reset of the inputs in the form (FIXED: Added className="h-9 text-xs" to stage details input).
- [x] In application view, the description needs a copy button to easily copy the job description (FIXED: Added 1-click Copy button with checkmark transition and toast feedback to Job Description header in ApplicationDetailView).

## Analytics Overview (`/analytics/overview`)

- [x] Missing active pipeline operational metric in top KPI summary (FIXED: Replaced negative-framed Rejection Rate with Active Pipeline KPI displaying concurrent in-flight volume and stage breakdown pills).
- [x] Lack of follow-up radar for applications in the 7–14 day window (FIXED: Enhanced GhostingRiskCard into Follow-Up & Ghosting Radar surfacing actionable follow-up candidates and stale applications with company quick search links).
- [x] Misplaced technical ATS domain telemetry on Overview coaching row (FIXED: Relocated ATS Domain Leaderboard to Strategic Insights and replaced with FunnelBottleneckCard diagnostic coaching).
- [x] Side-by-side status breakdown chart duplication (FIXED: Set default active tab in YearlyTrendsCard to "Total Volume" to pair status distribution with application volume over time).
- [x] WAI-ARIA tab keyboard navigation and year selector synchronization in YearlyTrendsCard (FIXED: Added ArrowLeft/ArrowRight handlers and unified header year selector).
- [x] Empty state for Status Breakdown donut chart when grandTotal is 0 (FIXED: Added empty state illustration and CTA link to /applications).
- [x] Section heading visual hierarchy and accessible `<h1>` document landmark (FIXED: Added sr-only h1 and scaled section headers to text-sm font-bold uppercase).
- [x] After selecting the month and year filters, when clicking on "View platform ROI" in the "Best performing platform" card, it redirects to `/overview/status-per-platform` and resets the filters (FIXED: Passed active `month` and `year` filter parameters to `BestPlatformsCard` and dynamically constructed target href to preserve filter query parameters when navigating to `/analytics/status-per-platform`).

## Analytics Status Per Platform (`/analytics/status-per-platform`)

- [x] In `/analytics/status-per-platform`, clicking on "View" redirects the user to the applications page with the search term set as the platform, giving misleading and incorrect application results (FIXED: Updated platform drilldown links to use `?platform=${encodeURIComponent(platformName)}` to filter strictly by the platform column in DataTable).
- [x] Perpetual motion and cognitive fatigue from `animate-bounce` on banner sparkles (FIXED: Replaced continuous bounce with subtle `motion-safe:animate-pulse`).
- [x] Inaccessible badge and highlight text contrast on light theme (FIXED: Updated to WCAG AA-compliant `text-emerald-700 dark:text-emerald-400` and `text-blue-700 dark:text-blue-400`).
- [x] Sorting controls lack ARIA group semantics and active state indicators (FIXED: Wrapped sort controls in `role="group"` with `aria-label` and `aria-pressed`).
- [x] Lack of dense table comparison mode for multi-platform tracking (FIXED: Added Table/Matrix comparison view toggle with responsive row layouts and quick actions).
- [x] Filter reset leaving trailing `?` in browser URL (FIXED: Switched to `usePathname()` for clean navigation).

## ATS Resume Checker (`/ats-checker`)

- [x] Tab switching in resume section destroying uploaded file or pasted draft (FIXED: Decoupled tab draft states in `ResumeInputSection` so toggling between tabs preserves all inputs).
- [x] Form inputs unlocked during active Gemini inference (FIXED: Passed `disabled={isAnalyzing}` to freeze dropzone, textarea, and mode switchers during processing).
- [x] Silent disabled submit button without requirement indicators (FIXED: Added dynamic live requirement badges above submit button explaining exact readiness).
- [x] Missing client-side file size and format validation (FIXED: Added client guards checking `<10MB` and `application/pdf` with immediate toast alerts).
- [x] Re-scan workflow wiping user inputs (FIXED: Added "Edit Inputs & Re-scan" button to results toolbar preserving in-memory draft).
- [x] Full-width mobile CTA ergonomics (FIXED: Applied `w-full sm:w-auto` to primary action button).
- [x] Truncated missing keyword placement advice (FIXED: Added expandable "Show all placement tips" toggle in `KeywordGapMatrix`).
- [x] Sub-44px popover touch target on dimension cards (FIXED: Wrapped popover triggers in padded `h-6 w-6` interactive wrappers).
- [x] Static progress bar colors for failing scores (FIXED: Dynamically mapped dimension bar colors by score tier: Emerald for ≥75%, Amber for 50–74%, Rose for <50%).
- [x] Lack of sample job description for instant exploration (FIXED: Added 1-click "Try Sample Job Description" button in `JobDescriptionInput`).
- [x] Missing full diagnostic summary export (FIXED: Added "Copy Full Report" action to results toolbar).
