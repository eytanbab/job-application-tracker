# Example Run

This shows a first run on a fictional project, condensed. Real interviews will have more back-and-forth, especially on follow-ups.

---

**Claude:** [checks .ux-audit/context.json — none found, runs the interview from references/interview.md]

I don't have saved context for this project yet — a few quick questions first so I'm not just giving generic feedback.

What does this product do, and who is it for?

**Developer:** It's a scheduling tool for clinics

**Claude:** Is the primary user clinic staff booking appointments on behalf of patients, or patients booking their own appointments directly?

**Developer:** Mostly clinic front-desk staff, patients only use it for the confirmation link

**Claude:** Got it. B2B or B2C, and what platform — web, mobile, desktop, or more than one?

**Developer:** B2B, web only, used on desktop in the clinic

**Claude:** Any known pain points or complaints you've already heard from staff?

**Developer:** They've said the signup form feels long

**Claude:** Is there a reference product you'd want this benchmarked against, or should I skip that?

**Developer:** skip it

**Claude:** [writes .ux-audit/context.json, then enumerates the files that make up the signup flow: SignupForm.jsx, FieldValidation.js, ConfirmationEmail.jsx, and the shared Button/Input components they use. Works through every category in categories.md against every one of those files, not just the first file that turns up an issue, from the front-desk-staff persona's perspective.]

Audit's done — 1 critical, 2 major, 4 minor, across 4 files and 19 categories (9 conditional categories didn't apply to this flow). Full report saved to `.ux-audit/reports/2026-08-11-signup.md`. Headline issue: the email confirmation step gives no feedback while sending, so staff can't tell if it's still working or has failed, which matches the "feels long" complaint you mentioned. Want me to walk through any of these, fix a specific one now, or leave it for later?

---

## Resulting report (`.ux-audit/reports/2026-08-11-signup.md`)

```markdown
# UX Audit — Signup

Date: 2026-08-11
Previous audit of this flow: none
Audit mode: Source-only
Screenshots: none
Personas used:
- Front-desk staff: books appointments on behalf of patients, works quickly between other tasks, desktop only
Files reviewed: SignupForm.jsx, FieldValidation.js, ConfirmationEmail.jsx, Button.jsx, Input.jsx
Categories checked: Visual hierarchy & layout (no issues found), Typography (no issues found), Color & contrast, Visual consistency & design system adherence (no issues found), Content & microcopy, Empty/loading/error states (no issues found), Navigation & IA (no issues found), Interaction & affordance, Forms & input, Task-flow friction, Cognitive load & complexity (no issues found), Feedback/confirmation/error prevention (no issues found), Accessibility (no issues found), Perceived performance, Platform-specific conventions (n/a — mobile/touch-target checks skipped, desktop-only product), Data display (n/a — no tables or charts in this flow), Search/filtering/sorting (n/a — not present in this flow), Onboarding (n/a — not a first-use screen), Personalization (n/a — no persisted preferences in this flow)

## Summary
1 critical, 2 major, 4 minor. The core issue is missing feedback during the multi-second email confirmation step, which likely explains the "feels long" complaint — the form isn't necessarily too long, it may just feel broken partway through.

## New findings

### System Trust & Feedback

#### Perceived performance — No feedback during email send
Severity: Critical
Where: SignupForm.jsx, handleSubmit (~line 84)
Persona affected: Front-desk staff — submits and gets no visual change for several seconds, likely to click submit again or assume it failed
Problem: Submit button shows no loading state while the confirmation email request is in flight
Fix: Disable the button and show a spinner or "Sending..." label from submit until the request resolves

### Interaction & Structure

#### Forms & input — Required fields not marked until after submit attempt
Severity: Major
Where: SignupForm.jsx, field definitions (~line 20)
Persona affected: Front-desk staff — fills the form top to bottom, hits submit, then discovers multiple unmarked required fields at once
Problem: No visual indicator (asterisk or label) shows which fields are required before submission
Fix: Add a required-field indicator to each label, not just validation-on-submit

### Content & Language

#### Content & microcopy — Generic error message on validation failure
Severity: Major
Where: FieldValidation.js, formatError (~line 31)
Persona affected: Front-desk staff — sees "Something went wrong" with no indication of which field or what to fix
Problem: Validation errors don't specify which field failed or why
Fix: Show inline errors under the specific field, stating what's wrong (e.g., "Enter a valid email")

### Visual Design

#### Color & contrast — Confirmation email preview text is low contrast
Severity: Minor
Where: ConfirmationEmail.jsx, line 18
Persona affected: Front-desk staff — the preview text (#aaa on white, ~2.3:1) is hard to read while double-checking the email before it sends
Problem: Preview text color falls well below WCAG AA
Fix: Darken to at least #767676 for 4.5:1 contrast at this font size

[3 additional minor findings omitted for brevity in this example]
```

