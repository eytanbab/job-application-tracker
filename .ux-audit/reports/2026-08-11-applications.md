# UX Audit — Applications Page

Date: 2026-08-11
Previous audit of this flow: none
Audit mode: Source-only
Personas used:
- **Alex (High-Volume Applicant)**: Applies to 15+ tech roles weekly; needs rapid logging, batch updates, fast filters, and zero form friction.
- **Taylor (Bootcamp Grad / Career Switcher)**: Meticulously tracks notes, job descriptions, and interview stages; needs clarity, non-destructive workflows, and save confidence.
- **Morgan (Mobile-First Job Seeker)**: Checks application statuses and logs leads on phone/tablet; needs touch-friendly controls (≥44px), clear touch targets, and non-overlapping floating UI elements.

## Summary

The Applications page (`/applications`) provides a flexible application tracking interface supporting both Data Table and Kanban board view modes, KPI stats summary, bulk actions, and detail sheets. However, severe UX friction exists around dual status inputs in forms, lack of keyboard accessibility for table rows & kanban cards, URL validation strictness, mobile FAB element overlap during bulk selection, and ambiguous auto-save behaviors in quick status updates.

- **Critical Count**: 2
- **Major Count**: 4
- **Minor Count**: 3

## New Findings

### Forms & Input — Confusing Dual Status Input Fields in Application Creation & Edit
Severity: Critical  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L120-L165)  
Persona affected: Alex & Taylor — Causes input confusion and accidental data overwrites when logging new applications.  
Problem: The form presents two separate, adjacent inputs: `statusCategory` ("Status category" dropdown) and `status` ("Stage details / Custom status" text input). Selecting a `statusCategory` automatically overwrites whatever the user previously typed in `status` with default label text (`statusLabels[value]`). Furthermore, both fields are marked as required (`min(2)`), forcing users to decipher the difference between "Status category" and "Stage details" before submitting.  
Fix: Streamline into a single combined Status select with preset categories (Applied, Review, Interview, Offer, Rejected, Ghosted) and an optional "Custom Stage Label" text field that only appears when needed. Do not overwrite custom text silently on category selection.

### Accessibility — Inoperable Keyboard Navigation on Table Rows & Kanban Cards
Severity: Critical  
Where: [data-table-grid.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-grid.tsx#L67-L72), [kanban-card.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/kanban-card.tsx#L84-L91)  
Persona affected: Alex & Taylor (Keyboard / Assistive Tech Users) — Unable to open application details or trigger row selection via keyboard.  
Problem: Data Table rows (`<TableRow onClick={...}>`) and Kanban cards (`<Card onClick={...}>`) are interactive elements with click handlers but lack `tabIndex={0}`, `role="button"`, and `onKeyDown` handlers for `Enter` / `Space` activation. Keyboard-only users cannot focus or activate rows/cards.  
Fix: Add `tabIndex={0}`, `role="button"`, and an `onKeyDown` handler checking for `e.key === 'Enter' || e.key === ' '` on table rows and kanban cards.

### Forms & Input — Strict URL Format Validation Fails Without Helpful Formatting
Severity: Major  
Where: [application-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form.tsx#L44)  
Persona affected: Alex — High friction when pasting job links directly from job boards.  
Problem: `link` uses Zod's `z.url()`, requiring strict URL schemes (e.g. `https://`). If a user pastes `linkedin.com/jobs/view/12345`, form submission fails with generic validation errors instead of automatically prepending `https://` or providing auto-formatting helper text.  
Fix: Normalize input URLs in `application-form.tsx` submit handler by checking if `link` starts with `http://` or `https://`, prepending `https://` automatically before running schema validation.

### Visual Hierarchy & Layout — Mobile Floating Action Button (FAB) Overlaps Bulk Toolbar & Pagination
Severity: Major  
Where: [data-table.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/data-table.tsx#L112-L123)  
Persona affected: Morgan — Interacting with mobile controls becomes difficult during bulk item selection.  
Problem: The floating "+" action button uses `fixed right-5 bottom-6 md:hidden` (or `bottom-24` when items are selected). When `selectedCount > 0`, the fixed FAB collides with the sticky mobile bulk actions bar and obscures bottom pagination controls.  
Fix: Position the mobile Add Application button cleanly within the toolbar header on mobile (`md:hidden`), or lift the FAB stack dynamically with `bottom-28 md:hidden` and adjust z-index to avoid touch target collision with bulk actions.

### Interaction & Microcopy — Unclear Auto-Save Mechanism in Quick Status Update Field
Severity: Major  
Where: [application-detail-view.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-view.tsx#L91-L104)  
Persona affected: Taylor — Hesitation and uncertainty over whether custom stage details were saved.  
Problem: The "Custom stage detail" text input in `ApplicationDetailView` triggers a server save on `onBlur` or `Enter` keypress, but offers no visual saving indicator or "Save" button. Users have no feedback confirming whether their edit registered.  
Fix: Add an explicit inline "Save" button or a visible success indicator (e.g. "Saved" checkmark fade badge) next to the input when content is modified.

### Responsive Design — Search Bar & Filter Controls Width Mismatch on Medium Viewports
Severity: Major  
Where: [data-table-toolbar.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/data-table-toolbar.tsx#L54-L130)  
Persona affected: Morgan & Alex — Awkward toolbar wrapping and layout shifts on tablet / fold devices.  
Problem: Search input is hardcoded to `max-w-xs` while status and platform dropdowns use `w-full md:w-[140px]`. On intermediate screen sizes (640px to 1024px), search bar shrinks while dropdowns stack awkwardly, creating uneven spacing.  
Fix: Refactor toolbar grid to `grid grid-cols-1 sm:grid-cols-2 lg:flex` for harmonious alignment across viewports.

### Content & Microcopy — Dual Inconsistent Edit Workflows (Inline Form vs External Sheet)
Severity: Minor  
Where: [application-detail-sheet.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/components/application-detail-sheet.tsx#L313-L345), [columns.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/columns.tsx#L297-L300)  
Persona affected: Taylor — Cognitive overhead from two different edit experiences.  
Problem: Clicking "Edit Details" inside the detail sheet toggles an inline form mode (`ApplicationDetailEditForm`), whereas clicking "Edit" from the table action menu opens a separate `EditApplicationSheet` modal.  
Fix: Standardize on a single editing workflow (either always opening `EditApplicationSheet` or always using inline editing in the detail drawer).

### Color & Contrast — Low Contrast for Ghosted Status Badges in Dark Mode
Severity: Minor  
Where: [columns.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/columns.tsx#L43)  
Persona affected: Alex & Taylor (Low Vision / Dark Mode Users) — Reduced legibility for ghosted status labels.  
Problem: `ghosted` status badge class uses `bg-muted/80 text-muted-foreground border-border/50`. In dark mode, `text-muted-foreground` against `bg-muted/80` achieves ~3.6:1 contrast ratio, falling below WCAG AA requirement of 4.5:1 for normal body text.  
Fix: Adjust ghosted badge class to `bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30` for solid WCAG AA contrast compliance.

### Visual Hierarchy & Layout — Sorting Header Buttons Lack Distinct Active State Visual Signal
Severity: Minor  
Where: [columns.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/columns.tsx#L92-L130)  
Persona affected: Alex — Difficult to tell which column is actively sorting table data.  
Problem: Table column headers use `<ArrowUpDown className="ml-2 h-3.5 w-3.5" />` regardless of whether the column is currently sorted ascending, descending, or unsorted.  
Fix: Render directional icons (`ArrowUp` for asc, `ArrowDown` for desc, `ArrowUpDown` for unsorted) and highlight the active column header text color when sorted.
