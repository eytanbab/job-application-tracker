# UX Audit — Application Form Flow

Date: 2026-08-13
Previous audit of this flow: 2026-08-11-application-form.md
Audit mode: Source-only
Personas used:
- **Alex (The Hustler)**: A software engineer actively applying to 10+ jobs a day. They need the form to be incredibly fast, supporting rapid data entry without friction. They don't want to spend more than 15 seconds logging an application.
- **Sam (The Detail-Oriented Professional)**: A senior professional who logs fewer jobs but wants to attach extensive notes, specific salary ranges, and custom stages. They care about structure and being able to quickly edit a job to add a new interview stage.

## Summary

The Application Form (`ApplicationForm`, `ApplicationFormFields`) has seen excellent improvements since the last audit! The AI auto-extract form is now properly hidden during edit mode, `ComboboxInput` was successfully implemented for locations and platforms to prevent data inconsistency, and the grid layouts and placeholders have been polished.

However, a few new critical friction points were discovered during this sweep, primarily around form validation and field requirements.

- **Critical Count**: 2
- **Major Count**: 0
- **Minor Count**: 2

## History Check

- **Resolved**: Visual Hierarchy & Layout — AI Auto-Extract Rendered During Edit Mode Risking Data Overwrite (Hidden via `!isEditing`).
- **Resolved**: Forms & Input — Free-Text Platform & Location Inputs Cause Data Inconsistency (Replaced with `ComboboxInput` and dynamic fetching).
- **Resolved**: Content & Microcopy — Unclear Placeholder Examples (Updated to `e.g. Acme Corp`).
- **Resolved**: Color & Contrast — Low Contrast for "OR" Divider Text (Styled with proper typography scale).

## New Findings

### Forms & Input — No Visual Indicators for Required Fields
Severity: Critical
Where: `app/_components/application-form-fields.tsx`
Persona affected: Alex & Sam — Both personas will experience friction and validation errors when trying to guess which fields are mandatory.
Problem: The Zod schema requires `role_name`, `company_name`, `location`, `platform`, and `statusCategory`. However, there are no visual indicators (like an asterisk `*` or a "(required)" label) on any of the `FormLabel` components. A user will only discover a field is required after attempting to submit and being hit with validation error messages.
Fix: Add a visual indicator (e.g., a red asterisk `*`) to the `FormLabel` of all required fields.

### Forms & Input — `link` Field Requires a Valid URL and Cannot Be Empty
Severity: Critical
Where: `app/_components/application-form.tsx` (Zod Schema)
Persona affected: Alex — Cannot quickly log applications that don't have a URL (e.g., direct email referrals, recruiters reaching out on LinkedIn messaging).
Problem: The Zod schema for `link` uses `z.string().trim().transform(...).pipe(z.url(...))`. Because it is not marked as allowing empty strings, Zod strictly enforces that the input must be a valid URL. If the user leaves the job posting URL empty because they don't have one, they are blocked from submitting the form entirely.
Fix: Update the schema to allow an empty string, e.g., `z.union([z.literal(""), z.string().trim().transform(...).pipe(z.url(...))])`.

### Visual Hierarchy & Layout — "Platform" and "Date Applied" Should Share a Row
Severity: Minor
Where: `app/_components/application-form-fields.tsx`
Persona affected: Sam — Unnecessary vertical scrolling, especially on desktop monitors where horizontal space is abundant.
Problem: Role, Company, Salary, and Location are laid out in a 2-column grid (`md:col-span-1`). However, "Platform" and "Date Applied" are both set to `col-span-full`, creating a lot of vertical stacking for relatively small inputs.
Fix: Change `Platform` and `Date Applied` to `md:col-span-1` so they sit side-by-side on larger viewports.

### Content & Microcopy — Generic "Submit" Button Label
Severity: Minor
Where: `app/_components/application-form-fields.tsx`
Persona affected: Alex & Sam
Problem: In "Create" mode, the primary call to action is labeled simply "Submit". This is slightly vague and less reassuring than a specific action verb.
Fix: Change the button label from "Submit" to "Add Application" when creating a new record. (The "Save Changes" label for edit mode is already perfect).
