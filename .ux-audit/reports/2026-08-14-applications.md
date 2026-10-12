# UX Audit — Applications Page & Application Management Flow

Date: 2026-08-14  
Previous audit of this flow: 2026-08-11 (2026-08-11-applications.md)  
Audit mode: Source-only  
Screenshots: none  
Personas used:
- **Alex (High-Velocity Applicant)**: Applies to 15+ tech roles weekly; needs rapid creation, keyboard shortcuts, fast filtering, and clear bulk actions.
- **Taylor (Detail-Oriented Job Hunter)**: Deeply tracks interview stages, extensive personal notes, salary negotiations, timeline history, and job descriptions; needs high confidence in edit saves and timeline clarity.
- **Morgan (Mobile Applicant)**: Reviews application status and details on mobile/tablet; needs accessible touch targets, non-overlapping modals, and smooth responsive navigation.

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

The Applications page (`/applications`), application detail sheet, edit workflow, and kanban/table interfaces have evolved into a rich, cohesive feature set. Recent fixes resolved critical status updates, reactive prop binding in detail sheets, and timeline history stacking.

However, several notable friction points and edge-case bugs remain:
1. **Critical Pagination Stride Bug**: When filtering or searching while on Page > 1, `autoResetPageIndex` does not reset `pageIndex`, causing false "No applications found" screens.
2. **Destructive Delete Inconsistency**: Deleting an application from the table actions menu requires confirmation, but deleting from the Kanban card menu or the Detail modal footer triggers instant deletion without confirmation.
3. **Task-Flow Discard Risk**: Canceling an inline edit inside the Detail modal silently discards typed candidate notes without an unsaved changes warning.

- **Critical Count**: 1
- **Major Count**: 4
- **Minor Count**: 4

---

## Resolved since last audit

- **Forms & Input — Confusing Dual Status Input Fields**: Synchronized category selection and stage details via `resolveUpdatedStatus` and `isStandardStatus`, preventing accidental overwrites while preserving custom stages.
- **Accessibility — Inoperable Keyboard Navigation on Table Rows & Kanban Cards**: Added `tabIndex={0}`, `role="button"` / `role="article"`, and `onKeyDown` handlers for `Enter` and `Space` activation on table rows and Kanban cards.
- **Forms & Input — Strict URL Validation Fails Without Auto-Formatting**: Added URL normalization to automatically prepend `https://` and allowed empty strings for recruiter/referral leads.
- **System Trust & Feedback — Status History Fails to Stack in Application Timeline**: Removed aggressive 5-minute deduplication overwrite in `updateApplication`, enabling full chronological stacking of status milestones.
- **Color & Contrast — Low Contrast for Ghosted Badges in Dark Mode**: Updated ghosted badge styles to `bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30`.
- **Visual Hierarchy & Layout — Sorting Headers Lack Distinct Active Indicator**: Rendered directional sort arrows (`ArrowUp`/`ArrowDown`/`ArrowUpDown`) and bold primary text for the active sorted column.

---

## New findings

### Interaction & Structure

#### Search, filtering & sorting — Pagination Index Desynchronization on Filter Change
Severity: Critical  
Where: [use-data-table.ts](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/hooks/use-data-table.ts#L86-L105), [use-data-table.ts](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/hooks/use-data-table.ts#L221)  
Persona affected: Alex (High-Velocity Applicant) & Morgan — High risk of missing matching job applications when searching or filtering.  
Problem: `useReactTable` is configured with `autoResetPageIndex: false`. If a user navigates to Page 2 or Page 3 and subsequently applies a search query or dropdown filter that returns fewer items (e.g., 2 matching jobs), `pageIndex` remains at 1 or 2 (Page 2 or 3). The table displays `"No applications found"` on Page 3 despite valid matching records existing on Page 1.  
Fix: In `use-data-table.ts`, add an effect or handler to automatically reset `pageIndex` to 0 (and URL search param `page=1`) whenever `globalFilter`, `statusFilter`, or `platformFilter` changes.

#### Task-flow friction — No Confirmation when Discarding Unsaved Notes in Detail Sheet Edit
Severity: Major  
Where: [application-detail-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-sheet.tsx#L282)  
Persona affected: Taylor (Detail-Oriented Job Hunter) — Risk of losing detailed interview prep notes or salary information.  
Problem: Clicking "Edit Details" inside `ApplicationDetailSheet` swaps the detail view for `ApplicationForm`. If the user writes extensive notes and accidentally clicks "Cancel", `setIsEditing(false)` immediately unmounts the form, discarding all unsubmitted changes with no warning.  
Fix: Before exiting edit mode on cancel, check if `form.formState.isDirty` is true; if dirty, prompt the user with a confirmation dialog to discard changes.

#### Forms & input — Overlapping Enter Instruction on Small Mobile Viewports
Severity: Minor  
Where: [application-detail-view.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-view.tsx#L116)  
Persona affected: Morgan (Mobile Applicant) — Visual clipping on mobile screens.  
Problem: The `"Press Enter"` helper text inside the custom stage detail input is positioned absolutely at `right-2.5 top-1/2`. On mobile screens (< 380px width) or when custom stage text is long, the badge text collides with the input text.  
Fix: Add `hidden sm:inline-block` to `"Press Enter"` on mobile viewports, or relocate the helper text above the input.

---

### System Trust & Feedback

#### Feedback, confirmation & error prevention — Inconsistent Delete Confirmation Between Table and Kanban/Sheet
Severity: Major  
Where: [kanban-card.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/kanban-card.tsx#L174), [application-detail-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-sheet.tsx#L330-L343)  
Persona affected: Taylor & Alex — Risk of accidental permanent deletion of job applications.  
Problem: In the Data Table row actions menu, clicking the trash icon opens a confirmation modal (`"Are you absolutely sure? This action cannot be undone..."`). However, clicking "Delete" in the Kanban card context menu or in the Detail modal footer directly calls `handleDelete(id)` with NO confirmation prompt, permanently deleting the application immediately on single click.  
Fix: Wrap the delete action in `KanbanCard` and `ApplicationDetailSheet` with the same standard confirmation `Dialog` used in `columns.tsx`.

#### Accessibility — Missing aria-labels on Icon-Only Actions
Severity: Minor  
Where: [application-detail-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-sheet.tsx#L228), [application-timeline.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-timeline.tsx#L96)  
Persona affected: Alex (Screen Reader / Assistive Tech User)  
Problem: The external job link button `<Button asChild><a href={activeApp.link} ...><ExternalLink /></a></Button>` in `ApplicationDetailSheet` and the delete timeline entry `<button>` in `ApplicationTimeline` use icons without programmatic `aria-label` attributes.  
Fix: Add `aria-label="Open original job posting in new tab"` and `aria-label="Delete this timeline entry"`.

---

### Visual Design

#### Visual hierarchy & layout — Hardcoded Micro-Scroll Heights for Job Description & Notes
Severity: Major  
Where: [application-detail-view.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-view.tsx#L165-L177)  
Persona affected: Taylor — Poor readability for long job specs and candidate notes.  
Problem: Job Description and Personal Candidate Notes in the detail modal are hardcoded to `max-h-44` (176px). Long job descriptions (300+ words) require awkward micro-scrolling inside a tiny nested box within a spacious modal.  
Fix: Increase max height to `max-h-64 sm:max-h-80` or provide an expand/collapse toggle for long text.

#### Visual consistency & design system adherence — Dual Inconsistent Edit Modals
Severity: Minor  
Where: [application-detail-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-sheet.tsx#L280), [edit-application-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/edit-application-sheet.tsx#L75)  
Persona affected: Taylor  
Problem: Clicking "Edit" from the table action menu opens `EditApplicationSheet` (`sm:max-w-md md:max-w-lg` centered dialog), while clicking "Edit Details" inside the detail view switches to an inline form inside the `max-w-2xl md:max-w-3xl` dialog. The two edit experiences have differing widths and padding.  
Fix: Consolidate or align dialog width dimensions across both entry points.

---

### Content & Language

#### Empty, loading & error states — Missing Guidance Placeholder in Empty Kanban Columns
Severity: Minor  
Where: [applications-kanban.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/applications-kanban.tsx#L210-L245)  
Persona affected: Taylor & Morgan  
Problem: When a Kanban column has 0 applications, it renders an empty grey box with no microcopy. First-time users or users with empty columns receive no visual cue explaining that cards can be dragged there.  
Fix: Render a subtle dashed placeholder with text: `"No applications in this stage — Drag cards here"`.

---

### Platform & Context

#### Platform-specific conventions — Mobile Floating Action Button (FAB) Overlap During Bulk Selection
Severity: Major  
Where: [data-table.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/data-table.tsx#L123-L125)  
Persona affected: Morgan (Mobile Applicant)  
Problem: When rows are selected (`selectedCount > 0`), the mobile FAB shifts to `bottom-32` while `DataTableBulkActions` sticks to the bottom. On compact mobile screens, the stacked FAB and bulk action bar obscure the bottom rows of the data table.  
Fix: Hide the floating Add button when `selectedCount > 0` (`selectedCount > 0 ? "hidden" : "fixed ..."`).
