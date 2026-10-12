# Job Application Tracker — Resolved Issues & Improvements

## Applications & Forms

- [x] "Quick Update Status" rerenders the form each keystroke when changing custom stage detail (FIXED: Decoupled quick status input state from currentApp and removed currentApp.status from history refetch useEffect dependencies).
- [x] The search functionality in `/applications` does not work properly. For example, searching for a company doesn't show all the results containing this company name (FIXED: Implemented custom case-insensitive multi-field global filter in `use-data-table.ts` searching across company name, role name, location, platform, status, statusCategory, salary, and description).
- [x] Updating the status category does not update the stage details in the edit application form. If a user changes the status category from "Applied" to any other status, the stage details stays on apply (FIXED: Updated `onValueChange` in `application-form-fields.tsx` to detect category transitions, automatically reset `status` to the standard label of the newly selected category, and clear previous custom text).
- [x] When viewing an application, the section of edit application and delete just floats at the bottom end of the modal (FIXED: Restructured `DialogContent` in `application-detail-sheet.tsx` into a flex layout with a fixed header, scrollable body, and docked bottom footer).
- [x] On mobile view - Applications page, it is almost impossible to press the "Next" button as the FAB is covering it (FIXED: Added pb-24 bottom clearance to grid container on mobile).
- [x] On mobile view - Applications page, "Rows per page" is overflowing and can be 2-3 lines (FIXED: Reorganized pagination controls into responsive stacked rows on mobile).
- [x] On mobile view - Applications page - Viewing application, the role name is not in the center as it has pr-6 on its parent div (FIXED: Removed asymmetric pr-6 from header flex wrapper).
- [x] On mobile view - Applications page - Viewing application, external link button is too close to the 'X' button (FIXED: Added mr-8 margin to separate action button from modal close button).
- [x] In Applications page - Viewing application, the 'quick update status' can be confusing for users who will not understand why the status shows twice (FIXED: Added explicit Stage Category and Custom Stage Detail labels with contextual placeholders).
- [x] In Applications page - Editing application, the stage details / custom status text size in the input is not in the same size as the reset of the inputs in the form (FIXED: Added className="h-9 text-xs" to stage details input).
- [x] When viewing an application, if a user has a custom stage detail, for example, an application with "Interview" as the stage category and "Screening Interview" as the custom stage detail, and he changes it to "Rejected", the application automatically saves it after the user changes the status category, and the custom stage stays the same as before, and it is getting added to the application timeline. Then the user changes the custom stage detail to "Rejected after screening interview", and it again saves it, making the application history have double incorrect entries (FIXED: Updated `resolveUpdatedStatus` to reset custom stage text to the default category label when switching categories, and updated `updateApplication` to update rather than duplicate recent status history entries for same-category refinements).
- [x] The "Update Status & Stage" section still shows "Auto-saves on change". Does it actually auto saves on change or its a leftover (FIXED: Removed misleading "Auto-saves on change" label; now cleanly displays live saving feedback when mutating).
- [x] Some fields are editable when viewing an application and some arent (FIXED: Standardized in-place click-to-edit across all fields: Role Name, Company Name, Date Applied, Platform, Location, Salary, Job Link, Job Description, and Notes all uniformly support click-to-edit with dirty-state tracking and docked Unsaved Changes bar).
- [x] The "Job Description" text area expands the whole width of the text, pushing "Application Timeline" to the buttom. If the job description is long the user needs to scroll heavily to see the application timeline (FIXED: Implemented collapsible Job Description container with max-height clamp, gradient fade-out, and "Show full description / Show less" toggle so timeline stays easily accessible).
- [x] The job link button looks disconnected and broken from the layout (FIXED: Relocated job link from top utility row into application header metadata directly below company name with domain preview, external link icon, and inline URL editor).
- [x] In the application table, the external link is near the company name, making it look like it redirects to the company website and not the application itself (FIXED: Moved external link icon from the company subtitle to the Role Title line, clearly indicating it links to the job posting).
- [x] When viewing an application and clicking on add reusme to it, it opens the edit application view and the user then needs to click again on the add resume (FIXED: Replaced edit-modal redirection with direct `AttachResumeDialog` modal allowing instant 1-click selection from saved resumes or direct PDF upload without navigating away).
- [x] A user cannot delete the attached resume from the application he added it to (FIXED: Added direct "Detach" button to the Applied Resume card with atomic DB dissociation and immediate toast confirmation, plus "Change" button for instant switching).
- [x] On laptops (for example 1440px width), the role & company column's width is wide, and the text trucates at the middle of the column (using half the space it has). I think about either making the role & copany name take the whole available width of this column, or make this column take less space (FIXED: Removed restrictive `max-w-[170px] xl:max-w-[220px]` container constraints in `columns.tsx`, setting `w-full min-w-0` so the role and company text utilize the entire available column width before truncating).

## Analytics Overview (`/analytics/overview`)

- [x] In the application funnel, progress bars did not tell the user anything meaningful and "Under review" stage conflated applied jobs with active review (FIXED: Replaced 4-stage isolated progress bars with a connected 3-stage canonical milestone funnel: `1. Applied ➔ 2. Interview ➔ 3. Offer` with clear stage counts, percentages, and step-to-step yield conversion badges).
- [x] Outcome KPI card "Interview to offer conversion" showed percentage as primary bold number while other cards showed counts (FIXED: Standardized all 3 outcome cards—Offers Received, No Response (30+ Days), and Rejections—to display integer counts as primary bold stat with percentage as secondary subtext).
- [x] "Platforms & Sources" top platform card displayed awkward "Sample: ... apps" badge (FIXED: Removed "Sample:" prefix and updated to clean "{N} applications logged" indicator).
- [x] Platforms table gave no indication of current sort order and automatically listed all platforms causing massive vertical scroll (FIXED: Added active column highlight styling, interactive Sort Controls toolbar pills for Volume/Interview Rate/Response Rate/Name, default Top 5 view limit with expandable "Show all" toggle, and search filter input).
- [x] Application activity bar chart only showed single year and lacked status breakdown (FIXED: Added multi-year selector and By Status / Total Volume toggle rendering stacked bars categorized by status: Offer, Interview, In Review, Applied, Rejected, Ghosted with interactive color legend).
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
- [x] If a user has documents saved, the platform automatically shows them in "1. Provide Your Resume". This whole section is messy and makes it hard for the user to understand what he sees. This whole section needs a UX rework to reduce the cognitive load and make it clearer (FIXED: Replaced generic banner with a dedicated Active Document Summary Card displaying title, category badge, file metadata, and cloud-synced readiness).
- [x] On small devices, the dropdown of the selected documents is overflowing the screen and its layout is horrible as it contains both the title and the document name in it, making it break the layout (FIXED: Added responsive `truncate` and `max-w` constraints to `SelectItem` and `SelectTrigger`, formatting title and file size into compact layout).
- [x] On small devices, "2. Target Job Description" drops to 2 lines making the whole layout shift (FIXED: Synchronized `CardHeader` layout to `flex flex-col sm:flex-row sm:items-center justify-between gap-2.5` to eliminate 2-line title wrapping).
- [x] There is no paste button for users to easily paste their resume and the job description (FIXED: Added 1-click "Paste" buttons using `navigator.clipboard.readText()` to both `ResumeInputSection` and `JobDescriptionInput`).

## Documents (`/documents`)

- [x] In the Upload Document form, in Document Category, the dropdown is not a shadcn/ui component (FIXED: Replaced native HTML select with shadcn/ui Select, SelectTrigger, SelectValue, SelectContent, and SelectItem components).
- [x] Deleting a document gives an error message but deletes the document from the UI (FIXED: Wrapped S3 object deletion in safe error-catching so missing or unconfigured S3 storage keys do not throw an unhandled error after the database document record has already been successfully deleted, and synchronized mock store deletion).

## Navigation & Layout

- [x] The sidenav at the bottom contains "Job Application Tracker v2.0" which is unnecessary (FIXED: Removed redundant static version footer from both desktop and mobile sidebars).
- [x] The breadcrumbs always show "Dashboard / " and then the page name (FIXED: Replaced hardcoded "Dashboard / " prefix with dynamic route-aware hierarchical breadcrumbs that accurately reflect current section and subsections).
