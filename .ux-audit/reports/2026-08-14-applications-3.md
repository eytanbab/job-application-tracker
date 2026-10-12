# UX Audit — Applications Page Deep Sweep (Part 3)

Date: 2026-08-14  
Previous audit of this flow: 2026-08-14 (2026-08-14-applications-2.md)  
Audit mode: Source-only  
Screenshots: none  
Personas used:
- **Alex (High-Velocity Applicant)**: Rapid logging, keyboard navigation, fast filtering, batch actions.
- **Taylor (Detail-Oriented Job Hunter)**: Deep tracking of notes, interview stages, salary info, and timeline history.
- **Morgan (Mobile Applicant)**: Responsive touch targets, non-overlapping floating UI, readable cards.

Files reviewed:
- `app/(pages)/applications/components/data-table-bulk-actions.tsx`
- `app/_components/ai-extract-form.tsx`
- `app/(pages)/applications/columns.tsx`
- `app/(pages)/applications/components/data-table-toolbar.tsx`
- `app/(pages)/applications/components/applications-kpi-summary.tsx`
- `components/ui/combobox-input.tsx`
- `app/(pages)/applications/hooks/use-data-table.ts`

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

This third audit pass focused on batch operations safety, AI form auto-fill edge cases, cross-component date consistency, and accessibility attributes in toolbars and KPI summary widgets.

- **Critical Count**: 1
- **Major Count**: 1
- **Minor Count**: 3

---

## Resolved since last audit

- **Search, filtering & sorting — Kanban Board Ignores Platform Filter**: `platformFilter` passed to `ApplicationsKanban` and applied to card grouping.
- **Data display & visualization — Pagination Controls Lack Visible Page Number Indicator**: Added "Page X of Y" indicator in `DataTableGrid`.
- **Feedback, confirmation & error prevention — Missing Ownership Verification in Timeline Delete**: Verified `jobApplications.userId` on deletion in `deleteStatusHistoryEntry`.
- **Platform-specific conventions — Timeline Delete Icon Invisible on Mobile**: Added mobile visibility classes.
- **Accessibility — Missing aria-label on Mobile Job Link**: Added explicit `aria-label`.

---

## New findings

### System Trust & Feedback

#### Feedback, confirmation & error prevention — Bulk Delete Permanently Deletes Selected Applications Without Confirmation
Severity: Critical  
Where: [data-table-bulk-actions.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-bulk-actions.tsx#L68-L76)  
Persona affected: Alex (High-Velocity Applicant) & Taylor — Severe data loss risk.  
Problem: Clicking the "Bulk Delete" button in the sticky bulk actions toolbar immediately executes `handleBulkDelete()`, deleting all selected job applications simultaneously with zero confirmation modal or undo safeguard.  
Fix: Wrap the "Bulk Delete" button with a confirmation `Dialog` requiring the user to explicitly confirm deleting `{selectedCount}` applications before executing the bulk deletion.

---

### Forms & Input

#### Forms & input — AI Auto-Fill Discards Job Posting URL If API Omission Occurs
Severity: Major  
Where: [ai-extract-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/ai-extract-form.tsx#L95)  
Persona affected: Alex — Lost job URL when using AI extraction.  
Problem: If the `/api/extract` scraper succeeds in extracting title and company but returns an empty `link` property in its payload, `autoFillValues` sets `link: aiAutoFill.application.link` (`""`), discarding the URL the user originally pasted into the URL input field.  
Fix: Fallback to the pasted input URL: `link: aiAutoFill.application.link || values.url`.

---

### Visual Design & Consistency

#### Visual consistency & design system adherence — Inconsistent Date Format in Table Columns
Severity: Minor  
Where: [columns.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/columns.tsx#L157)  
Persona affected: All users  
Problem: Table column renders dates in numerical `dd/MM/yyyy` format, while Mobile Cards, Detail View, and Timeline render dates as `MMM d, yyyy` (e.g. `Aug 14, 2026`). The numerical format is ambiguous for international/US users.  
Fix: Standardize on `formatDate(parseISO(rawDate), "MMM d, yyyy")` in `columns.tsx`.

---

### Accessibility & Interaction

#### Accessibility — View Mode Buttons and Mobile Filter Toggle Lack State Attributes
Severity: Minor  
Where: [data-table-toolbar.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-toolbar.tsx#L83-L99), [data-table-toolbar.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-toolbar.tsx#L172-L198)  
Persona affected: Alex (Assistive Tech / Screen Reader User)  
Problem: The Table / Kanban view switcher buttons lack `aria-pressed` attributes to announce the currently active view mode. The mobile filter trigger button lacks `aria-expanded`.  
Fix: Add `aria-pressed={viewMode === "table"}` and `aria-pressed={viewMode === "kanban"}` to the view toggle buttons, and `aria-expanded={isMobileFilterOpen}` to the mobile filter button.

#### Interaction & affordance — KPI Summary Cards Lack Tooltip Explaining Interactive Filter Capability
Severity: Minor  
Where: [applications-kpi-summary.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/applications-kpi-summary.tsx#L103)  
Persona affected: Taylor & Morgan  
Problem: KPI cards function as clickable status filters, but provide no hover tooltip or textual indicator to explain this feature to first-time users.  
Fix: Add a descriptive `title={isActive ? "Active filter (click to reset)" : "Click to filter by status"}` attribute to each KPI card.
