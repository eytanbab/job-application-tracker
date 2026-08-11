# UX Audit — Application Form Flow

Date: 2026-08-11
Previous audit of this flow: none
Audit mode: Source-only
Personas used:
- **Alex (High-Volume Applicant)**: Applies to 15+ tech roles weekly; needs rapid logging, AI auto-fill convenience, clear suggestions, and minimum input friction.
- **Taylor (Bootcamp Grad / Career Switcher)**: Meticulously tracks notes, job descriptions, and interview stages; needs clarity when editing, protection against accidental field overwrites, and clear save confirmation.
- **Morgan (Mobile-First Job Seeker)**: Logs applications on mobile/tablet; needs touch-friendly inputs, clear label alignment, and responsive field layouts.

## Summary

The Application Form (`ApplicationForm`, `ApplicationFormFields`, `AiExtractForm`, `EditApplicationSheet`) serves as the core entry point for logging and updating job applications. While the addition of AI auto-extraction and date pickers provides convenience, significant UX friction exists when editing existing records (where AI extraction can accidentally overwrite data), text inputs lack auto-suggestions for platforms/locations, and field layout hierarchy creates visual clutter inside dialog modals.

- **Critical Count**: 1
- **Major Count**: 3
- **Minor Count**: 4

## New Findings

### Visual Hierarchy & Layout — AI Auto-Extract Rendered During Edit Mode Risking Data Overwrite
Severity: Critical  
Where: [application-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form.tsx#L133)  
Persona affected: Taylor — Risk of accidentally overwriting manually entered notes and custom application details when editing.  
Problem: `AiExtractForm` ("Auto-Extract Details") is rendered at the top of `ApplicationForm` regardless of whether the form is in "Create" mode or "Edit" mode (`defaultValues.id` exists). When a user opens an existing application to make a quick edit, running the AI extraction tool will overwrite all existing form fields (including personal candidate notes and location) without any confirmation prompt or restore option.  
Fix: Hide `AiExtractForm` when `Boolean(defaultValues?.id)` is true (editing an existing application), or wrap AI extraction in a collapsable / creation-only section.

### Forms & Input — Free-Text Platform & Location Inputs Cause Data Inconsistency
Severity: Major  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L166-L182)  
Persona affected: Alex — Increased typing effort and frequent capitalization/spelling inconsistencies (`LinkedIn`, `linkedin`, `LinkdIn`).  
Problem: `platform` and `location` are unconstrained free-text inputs. Applicants typing platform names manually often introduce typos or inconsistent casing, which degrades filter accuracy and analytics charts later in the application tracker.  
Fix: Provide combobox / datalist auto-suggestions for popular job platforms (LinkedIn, Indeed, Glassdoor, Greenhouse, Lever, Workday) and common locations (Remote, Hybrid, On-site, or previous user locations).

### Forms & Input — AI URL Extraction Input Lacks Clear Context & Error Recovery
Severity: Major  
Where: [ai-extract-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/ai-extract-form.tsx#L107-L123)  
Persona affected: Alex & Morgan — Uncertainty over how AI extraction works and how to recover from failed URL scrapes.  
Problem: The input label is simply `"URL"`, which doesn't specify what URL to paste (e.g. LinkedIn job posting link vs company homepage). When extraction fails, static error text appears, but the input is not cleared or focused, leaving the user unsure whether to retry or enter data manually.  
Fix: Change the label to `"Job Posting URL for AI Auto-Fill"`, add placeholder text specifying supported boards (e.g. `https://www.linkedin.com/jobs/view/...`), and provide a clear "Try Manual Entry" action button when extraction fails.

### Visual Hierarchy & Layout — Inconsistent Grid Column Spanning on Mobile & Medium Screens
Severity: Major  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L50-L270)  
Persona affected: Morgan — Cramped layout and awkward label line wrapping on smaller viewports.  
Problem: The form uses `grid grid-cols-2 gap-3`, with some inputs using `col-span-full md:col-span-1` and others using `col-span-full`. Labels like `"Stage details / Custom status"` wrap into 3 lines on mobile viewports, taking up excessive vertical height.  
Fix: Standardize grid column layout to `flex flex-col gap-3 sm:grid sm:grid-cols-2`, shorten long label strings to concise text with optional tooltip guidance, and adjust gap spacing.

### Content & Microcopy — Unclear Placeholder Examples in Form Inputs
Severity: Minor  
Where: [application-form-fields.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form-fields.tsx#L75)  
Persona affected: Alex & Taylor — Minor visual clutter from informal placeholder strings.  
Problem: `company_name` placeholder is `"Apple | Facebook | etc.."`, which looks unfinished compared to modern SaaS forms.  
Fix: Update placeholder to standard example format, such as `e.g. Acme Corp` or `e.g. Google`.

### Content & Microcopy — Anxiety-Inducing AI Loading Microcopy
Severity: Minor  
Where: [ai-extract-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/ai-extract-form.tsx#L131-L133)  
Persona affected: Alex — Creates friction and hesitation during fast job application logging.  
Problem: Helper text states `"Extraction may take up to 1 minute."`, which makes applicants hesitate to use the feature.  
Fix: Update copy to `"AI is extracting job details (~10-15 seconds)..."` and display animated skeleton pulses on the form inputs while loading.

### Interaction & Affordance — Missing Visual Confirmation Highlight After AI Auto-Fill
Severity: Minor  
Where: [application-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form.tsx#L86-L90)  
Persona affected: Alex & Taylor — Hard to notice which fields were populated by AI vs which fields need manual review.  
Problem: When `onAutoFill` populates form fields, no visual highlight or toast appears to inform the user which fields were auto-filled (e.g. role title, company, job description) and which fields require verification.  
Fix: Trigger a success toast (`"Job details extracted! Please verify the populated fields below."`) and briefly flash auto-filled input borders.

### Color & Contrast — Low Contrast for "OR" Divider Text
Severity: Minor  
Where: [application-form.tsx](file:///C:/Users/Eytan/next-js/job-application-tracker/app/_components/application-form.tsx#L136-L140)  
Persona affected: Alex & Taylor — Weak visual separation between AI and manual entry modes.  
Problem: The `"OR"` divider span uses unstyled text against a thin border line, blending into the modal background without proper spacing or font weight.  
Fix: Style the divider text with `text-xs font-semibold uppercase text-muted-foreground bg-background px-2` centered over a horizontal line.
