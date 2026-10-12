# UX Audit — Applications Page Deep Sweep (Part 4)

Date: 2026-08-14  
Previous audit of this flow: 2026-08-14 (2026-08-14-applications-3.md)  
Audit mode: Source-only  
Screenshots: none  
Personas used:
- **Alex (High-Velocity Applicant)**: Rapid logging, keyboard navigation, fast filtering, batch actions.
- **Taylor (Detail-Oriented Job Hunter)**: Deep tracking of notes, interview stages, salary info, and timeline history.
- **Morgan (Mobile Applicant)**: Responsive touch targets, non-overlapping floating UI, readable cards.

Files reviewed:
- `app/_components/application-form-fields.tsx`
- `app/_components/application-form.tsx`
- `app/(pages)/applications/columns.tsx`
- `components/ui/combobox-input.tsx`
- `app/(pages)/applications/new/page.tsx`
- `app/_components/new-application-button.tsx`

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

This fourth sweep focused on date picker time boundaries, form schema null-safety for legacy database records, checkbox indeterminate states, and semantic ARIA roles on form triggers.

- **Critical Count**: 0
- **Major Count**: 2
- **Minor Count**: 2

---

## Resolved since last audit

- **Feedback, confirmation & error prevention — Bulk Delete Confirmation**: Added confirmation Dialog in `DataTableBulkActions`.
- **Forms & input — AI Form URL Direct Mapping**: Directly mapped user pasted input URL to the application `link`.
- **Visual consistency & design system adherence — Table Date Format**: Standardized to `MMM d, yyyy` in `columns.tsx`.
- **Accessibility — Toolbar ARIA State Attributes**: Added `aria-pressed` to view switchers and `aria-expanded` to mobile filter trigger.
- **Interaction & affordance — KPI Tooltips**: Added descriptive status filter tooltips to summary metric cards.

---

## New findings

### Forms & Input

#### Forms & input — Date Picker Future Date Restriction Can Disable "Today"
Severity: Major  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L171-L173)  
Persona affected: Alex & Taylor — Friction logging applications submitted on the same day.  
Problem: `disabled={(date: Date) => date > new Date()}` uses the exact current timestamp `new Date()` (with hours and minutes). Depending on the user's timezone or current time, selecting "Today" in the calendar popover can be disabled as a future date.  
Fix: Use `date > endOfDay(new Date())` from `date-fns` to ensure the entire current day remains selectable.

#### Forms & input — Form Schema Fails If Database Contains Nullable `link`
Severity: Major  
Where: [application-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form.tsx#L49-L60)  
Persona affected: Taylor — Schema validation failure when editing existing records.  
Problem: The Zod schema expects `link: z.string()`. If an existing database record has `link: null`, Zod fails initial validation before transformation.  
Fix: Update schema to `z.string().nullable().optional().transform((val) => { const str = (val ?? "").trim(); return str && !/^https?:\/\//i.test(str) ? https://${str} : str; })`.

---

### Data Display & Visualization

#### Data display & visualization — Select All Checkbox Lacks Visual Indeterminate State
Severity: Minor  
Where: [columns.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/%28pages%29/applications/columns.tsx#L107-L117)  
Persona affected: Alex (High-Velocity Applicant)  
Problem: When some (but not all) rows on the current table page are selected, the table header checkbox remains unchecked instead of showing the standard indeterminate dash (`-`), obscuring partial selection status.  
Fix: Attach an indeterminate ref that sets `ref.current.indeterminate = !isAllSelected && isSomeSelected`.

---

### Accessibility

#### Accessibility — Inappropriate `role="combobox"` on Date Picker Button Trigger
Severity: Minor  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L149)  
Persona affected: Alex (Assistive Tech / Screen Reader User)  
Problem: The Date Applied button uses `role="combobox"`. Per W3C WAI-ARIA guidelines, `combobox` is reserved for composite inputs with auto-complete listboxes. A button triggering a calendar popover should not declare `role="combobox"`.  
Fix: Remove `role="combobox"` from the Date Applied Popover trigger button.
