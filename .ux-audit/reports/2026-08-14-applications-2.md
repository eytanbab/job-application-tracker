# UX Audit — Applications Page Deep Sweep (Part 2)

Date: 2026-08-14  
Previous audit of this flow: 2026-08-14 (2026-08-14-applications.md)  
Audit mode: Source-only  
Screenshots: none  
Personas used:
- **Alex (High-Velocity Applicant)**: Rapid logging, keyboard navigation, fast filtering, batch actions.
- **Taylor (Detail-Oriented Job Hunter)**: Deep tracking of notes, interview stages, salary info, and timeline history.
- **Morgan (Mobile Applicant)**: Responsive touch targets, non-overlapping floating UI, readable cards.

Files reviewed:
- `app/(pages)/applications/page.tsx`
- `app/(pages)/applications/data-table.tsx`
- `app/(pages)/applications/columns.tsx`
- `app/(pages)/applications/hooks/use-data-table.ts`
- `app/(pages)/applications/components/data-table-toolbar.tsx`
- `app/(pages)/applications/components/data-table-grid.tsx`
- `app/(pages)/applications/components/data-table-bulk-actions.tsx`
- `app/(pages)/applications/components/data-table-mobile-card.tsx`
- `app/(pages)/applications/components/applications-kpi-summary.tsx`
- `app/(pages)/applications/components/applications-kanban.tsx`
- `app/(pages)/applications/components/kanban-card.tsx`
- `app/(pages)/applications/components/application-detail-sheet.tsx`
- `app/(pages)/applications/components/application-detail-view.tsx`
- `app/(pages)/applications/components/application-timeline.tsx`
- `app/_components/edit-application-sheet.tsx`
- `app/_components/application-form.tsx`
- `app/_components/application-form-fields.tsx`
- `app/_components/ai-extract-form.tsx`
- `app/actions/applications.ts`
- `app/db/schema.ts`

Categories checked:
- Visual hierarchy & layout
- Typography
- Color & contrast
- Visual consistency & design system adherence
- Content & microcopy
- Empty, loading & error states
- Navigation & information architecture
- Interaction & affordance
- Forms & input
- Task-flow friction
- Cognitive load & complexity
- Search, filtering & sorting
- Data display & visualization
- Feedback, confirmation & error prevention
- Accessibility
- Perceived performance
- Platform-specific conventions
- Personalization & state persistence
- Onboarding & first-use experience (no issues found)

---

## Summary

This second deep sweep examined secondary flows, state persistence, authorization boundaries, cross-view filtering synchronization (Table $\leftrightarrow$ Kanban), mobile touch targets, and pagination affordances.

Several important findings were uncovered:
1. **Kanban Platform Filter Desynchronization**: The Platform dropdown filter on the toolbar is completely ignored when viewing the Kanban board, causing a disconnect when switching between Table and Kanban modes.
2. **Missing Page Number Indicator in Pagination**: Table pagination provides Previous/Next buttons and total count, but lacks a visible "Page X of Y" indicator.
3. **Mobile Touch Target for Timeline Delete**: The timeline entry delete icon relies on CSS `opacity-0 group-hover:opacity-100`, making it invisible on touch/mobile devices without mouse hover.
4. **Missing Ownership Check in Timeline Entry Deletion Action**: `deleteStatusHistoryEntry` in server actions lacked a user ownership join check.

- **Critical Count**: 0
- **Major Count**: 3
- **Minor Count**: 2

---

## Resolved since last audit

- **Search, filtering & sorting — Pagination Index Desynchronization on Filter Change**: Fixed by adding an automatic page reset effect in `useDataTable`.
- **Feedback, confirmation & error prevention — Inconsistent Delete Confirmation**: Added confirmation modal dialogs to Kanban card delete and Application Detail sheet footer delete.
- **Task-flow friction — No Confirmation when Discarding Unsaved Notes**: Added `form.formState.isDirty` safety confirmation on cancel in `ApplicationForm`.
- **Visual hierarchy & layout — Hardcoded Micro-Scroll Heights**: Expanded container heights for Job Description and Candidate Notes in `ApplicationDetailView`.
- **Platform-specific conventions — Mobile Floating Action Button (FAB) Overlap**: Hidden FAB when bulk selection mode is active.

---

## New findings

### Interaction & Structure

#### Search, filtering & sorting — Kanban Board Ignores Platform Filter
Severity: Major  
Where: [applications-kanban.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/applications-kanban.tsx#L23-L28), [data-table.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/data-table.tsx#L94-L101)  
Persona affected: Alex & Taylor — Unexpected filtering behavior when switching between Table and Kanban views.  
Problem: `DataTableToolbar` allows users to filter applications by Platform (e.g. LinkedIn, Indeed, Company Site). However, `ApplicationsKanban` only accepts `searchFilter` and `statusFilter`. When a user selects a Platform filter in the toolbar and switches to Kanban view, the board ignores the filter and renders applications from all platforms.  
Fix: Pass `platformFilter={platformFilter}` to `ApplicationsKanban` and filter by platform inside `groupedData` / `filteredData` using `item.platform`.

#### Data display & visualization — Pagination Controls Lack Visible Page Number Indicator
Severity: Major  
Where: [data-table-grid.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-grid.tsx#L184-L235)  
Persona affected: Alex & Morgan — Disorientation in multi-page datasets.  
Problem: The pagination footer displays `"Showing 10 of 45 application(s)"` and provides "Previous" and "Next" buttons, but does not state the current page number or total pages (e.g., "Page 2 of 5"). Users cannot determine which page they are currently browsing or how far they are from the end without calculating based on page size.  
Fix: Add `<span className="text-xs font-medium text-foreground">Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</span>` between the rows-per-page selector and the Previous/Next buttons.

---

### System Trust & Feedback

#### Feedback, confirmation & error prevention — Missing User Authorization Verification in Timeline Entry Deletion
Severity: Major  
Where: [applications.ts](file:///C:/Users/Eytan/next-js/job-application-tracker/app/actions/applications.ts#L202-L210)  
Persona affected: All users (System Security & Data Integrity)  
Problem: `deleteStatusHistoryEntry(historyId)` deletes from `applicationStatusHistory` solely by `id = historyId` without checking if the parent `jobApplication` belongs to the authenticated `userId`.  
Fix: Add an `innerJoin` with `jobApplications` on `jobApplications.id = applicationStatusHistory.applicationId` to verify `jobApplications.userId = userId` before executing the delete.

---

### Platform & Context

#### Platform-specific conventions — Timeline Entry Delete Icon Invisible on Mobile Touch Devices
Severity: Minor  
Where: [application-timeline.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-timeline.tsx#L98)  
Persona affected: Morgan (Mobile Applicant)  
Problem: The delete `X` button on timeline history entries uses `opacity-0 group-hover:opacity-100`. Because touch devices do not support hover states, the delete button is completely invisible on mobile devices unless the user happens to tap the exact invisible pixel area.  
Fix: Change opacity classes to `opacity-100 md:opacity-0 md:group-hover:opacity-100` so mobile users can see and tap the button.

#### Accessibility — Missing Programmatic aria-label on Mobile Card Job Posting Link
Severity: Minor  
Where: [data-table-mobile-card.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-mobile-card.tsx#L138)  
Persona affected: Alex (Screen Reader / Assistive Tech User)  
Problem: The external job posting link `<a href={item.link}>` in `DataTableMobileCard` has `title="Open Link"`, but lacks an explicit `aria-label="Open original job posting (opens in new tab)"`.  
Fix: Add `aria-label="Open original job posting (opens in new tab)"` to the anchor element.
