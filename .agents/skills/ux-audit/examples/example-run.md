# Example Walkthrough: Signup Flow Audit

This walkthrough shows a complete run: Auto-Detect & Confirm intake, measurement with the bundled scripts, verification, and the full report. Treat the report as the quality bar. Note the calibrated severities, honest confidence labels, the mix of recommendation formats, and how every number in the stakeholder layer matches the findings.

---

## Interactive Turns

**Agent:**
I inspected your repository and detected the following UX context:
- **Product**: Clinical appointment scheduling & patient intake dashboard.
- **Audience**: Clinic front-desk staff booking on behalf of patients; clinicians reviewing schedules; secondary audience is patients confirming via SMS/email.
- **Platform**: Web (desktop at reception, phones for clinicians).
- **Tech Stack**: Next.js (App Router), React, TailwindCSS, shadcn/ui (Radix), react-hook-form.
- **Business Model**: B2B SaaS.

Does this look accurate? And which flow should I audit?

**Developer:**
Looks accurate. Audit the signup flow. Staff mentioned the form feels slow, and some invited staff never finish signing up.

**Agent:**
Saved context to `.ux-audit/context.json`. Enumerated 8 in-scope files from `app/(auth)/signup/page.tsx`. Ran `token_inventory.js` on the auth components and `contrast.js` on the resolved text colors. No findings ledger yet, so this is a first run. Proceeding with the six audit passes for two personas: Front-desk Rachel and Dr. Omar.

*(The agent then sweeps, verifies, rates, and writes the report below.)*

**Agent (Step 8 summary):**
> Signup works, but it is harder than it needs to be for invited staff: they're asked for a clinic NPI they don't have, and errors don't say which field is wrong.
>
> **Scores:** Visual 4 · Content 3 · Flow 3 · Trust 3 · A11y 3 · Platform 4
>
> **Top priorities:**
> 1. Build one shared field component for labels and errors (`[FORM-01]`, `[A11Y-01]`, `[COPY-01]`)
> 2. Show progress while the account is created (`[PERF-01]`)
> 3. Pre-fill clinic details from the invite link (`[FLOW-01]`)
>
> **Totals:** 0 Critical · 5 High · 1 Medium · 1 Low · 4 Quick Wins · 1 to verify
>
> Report: `.ux-audit/reports/2026-08-22-signup.md`
>
> I haven't changed any code. The *Now* column has 5 items, 3 of them Quick Wins. Want me to start there?

---

## Resulting Report (`.ux-audit/reports/2026-08-22-signup.md`)

````markdown
# UX Audit — Signup Flow

> **Verdict:** Signup works, but it is harder than it should be for the people who use it most. Invited front-desk staff are asked for a clinic NPI number they don't have, and when anything goes wrong the form doesn't say which field is wrong or how to fix it. There are no Critical issues. The most valuable move is a shared field component that owns labels and errors, which resolves three findings in one change, followed by pre-filling clinic details from the invite link.

| | |
| :--- | :--- |
| **Date** | 2026-08-22 |
| **Scope** | Signup: 1 screen + terms dialog, 8 files ([details](#files-reviewed)) |
| **Mode** | Source-only |
| **Personas** | Front-desk Rachel, Dr. Omar ([details](#personas)) |
| **Previous audit** | None |

---

## Scorecard

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| Visual design & craft | 4 | Clear single-column hierarchy; the auth screens drift from the design tokens (`[DSYS-01]`). |
| Content & clarity | 3 | Error messages don't say what to do (`[COPY-01]`). |
| Interaction & flow | 3 | Invited staff are asked for data they don't have (`[FLOW-01]`); placeholder-only labels (`[FORM-01]`). |
| Feedback & trust | 3 | No feedback during a 2–4 s submit (`[PERF-01]`). |
| Accessibility | 3 | Errors aren't announced or tied to fields (`[A11Y-01]`); placeholder-only labels; one contrast failure (`[COLOR-01]`). |
| Platform fit | 4 | Correct input types and autocomplete; mobile layout not rendered in this mode. |

*1 Broken · 2 Poor · 3 Adequate · 4 Good · 5 Excellent · — Not evaluable in this mode.*

---

## What's Working

- **One clear primary action.** The form is a single column ending in one primary button ([`SignupForm.tsx:40`](../../src/components/auth/SignupForm.tsx#L40)), so the screen reads top to bottom with no competing CTAs. Keep this when adding the invite context line in `[FLOW-01]`.
- **Inputs are typed for autofill.** Every field sets the right `type` and `autoComplete` (`email`, `new-password`) in [`AuthInput.tsx:18`](../../src/components/auth/AuthInput.tsx#L18). Password managers and mobile keyboards work correctly. Preserve these props when refactoring into a shared field.
- **The terms dialog is accessible by construction.** [`TermsDialog.tsx`](../../src/components/auth/TermsDialog.tsx#L12) uses the shadcn/Radix `Dialog` with a `DialogTitle`, so focus trapping, Escape to close, and focus return come built in.

---

## Top Priorities

1. **Make every field explain itself, before and after an error.** Labels vanish as staff type, and errors appear only in a banner at the top that screen readers don't announce. One shared field component fixes all three related findings at once. Resolves `[FORM-01]`, `[A11Y-01]`, `[COPY-01]`. Effort: Low.
2. **Show that the account is being created.** The 2–4 s submit with no feedback is the "feels slow" complaint. Users re-click and get a confusing "Error 409". Resolves `[PERF-01]`. Effort: Quick Win.
3. **Let invited staff finish without information they don't have.** The required clinic NPI field is the most likely cause of invited staff abandoning signup. Resolves `[FLOW-01]`. Effort: Medium.

---

## Themes

### Theme A: Labels and errors are handled ad hoc, not by a shared field pattern
Each piece of field behavior (label, hint, error text, ARIA wiring) is implemented separately, or not at all, across `AuthInput`, `ValidationBanner`, and `SignupForm`. Because nothing owns the pattern, every new form will repeat these gaps.
- **Findings**: `[FORM-01]`, `[A11Y-01]`, `[COPY-01]`
- **Systemic fix**: Use the shadcn `Form` primitives (`FormField`, `FormLabel`, `FormDescription`, `FormMessage`), which wire `htmlFor`, `aria-describedby`, and `aria-invalid` automatically. Adopt one error-message pattern: *what happened + how to fix it*.

### Theme B: The auth screens bypass the design tokens
The token inventory shows the auth components using two neutral palettes (`gray`, `slate`) and 3 arbitrary values, while the rest of the app uses semantic tokens. The auth screens were built before the design system and never migrated.
- **Findings**: `[COLOR-01]`, `[DSYS-01]`
- **Systemic fix**: Replace raw values with semantic tokens (`text-muted-foreground`, `bg-primary`, `rounded-md`), and use the shared `<Button>` instead of the custom `SubmitButton`.

---

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `[PERF-01]` No feedback while creating account | `[FLOW-01]` Invited staff asked for clinic NPI | — |
| `[FORM-01]` Placeholder-only labels | `[DSYS-01]` Submit button off-token | |
| `[A11Y-01]` Errors not announced or tied to fields | | |
| `[COPY-01]` Error messages don't say how to fix | | |
| `[COLOR-01]` Hint text fails contrast | | |

**At a glance:** 🔴 0 Critical · 🟠 5 High · 🟡 1 Medium · 🔵 1 Low · ⚡ 4 Quick Wins · 1 to verify

---

## Findings

| ID | Finding | Severity | Confidence | Effort | Priority | Theme |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `[PERF-01]` | No feedback while the account is being created | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | — |
| `[COPY-01]` | Error messages don't say what's wrong or how to fix it | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | A |
| `[FORM-01]` | Placeholder text is the only label on all 6 fields | 🟠 High | Code-confirmed | Low | Now | A |
| `[A11Y-01]` | Errors aren't announced or associated with their fields | 🟠 High | Code-confirmed | Low | Now | A |
| `[COLOR-01]` | Email hint text is 2.53:1 contrast | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Now | B |
| `[FLOW-01]` | Invited staff must enter a clinic NPI they don't have | 🟠 High | Code-confirmed | Medium | Next | — |
| `[DSYS-01]` | Submit button uses hard-coded color and radius | 🔵 Low | Code-confirmed | ⚡ Quick Win | Next | B |

### `[PERF-01]` No feedback while the account is being created

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. `SubmitButton` takes no pending prop, and `SignupForm` never reads `formState.isSubmitting`. The signup request awaits account creation and the welcome email, which matches the 2–4 s staff reported.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: —
- **Location**: [`src/components/ui/SubmitButton.tsx:8`](../../src/components/ui/SubmitButton.tsx#L8)
- **Persona**: **Front-desk Rachel**: clicks "Create account" between patients, sees nothing change, and clicks again. The second request fails with "Error 409", so she believes signup failed even though her account exists.

**Problem.** The system doesn't show its status (Nielsen #1). This is the "feels slow" complaint: the wait is the same, but with no feedback it feels broken. It is High rather than Critical because the duplicate request causes confusion, not harm. On a payment form, the same pattern would be Critical.

**Recommendation.** Show a pending state immediately on click, prevent duplicate submits, and announce the state to screen readers.

```diff
- export function SubmitButton({ children }: { children: React.ReactNode }) {
+ export function SubmitButton({ children, pending, pendingLabel }: {
+   children: React.ReactNode; pending: boolean; pendingLabel: string
+ }) {
    return (
-     <button type="submit" className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-white outline-none focus-visible:ring-2">
-       {children}
+     <button type="submit" disabled={pending} className="rounded-[7px] bg-[#2563eb] px-4 py-2 text-white outline-none focus-visible:ring-2 inline-flex items-center gap-2 disabled:opacity-80">
+       {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
+       {pending ? pendingLabel : children}
+       <span role="status" className="sr-only">{pending ? pendingLabel : ""}</span>
      </button>
    )
  }
```
```diff
- <SubmitButton>Create account</SubmitButton>
+ <SubmitButton pending={formState.isSubmitting} pendingLabel="Creating account…">Create account</SubmitButton>
```

**Acceptance criteria**
- [ ] Within 100 ms of clicking, the button shows a spinner and "Creating account…".
- [ ] Clicking repeatedly sends only one request.
- [ ] A screen reader announces "Creating account…".

---

### `[COPY-01]` Error messages don't say what's wrong or how to fix it

- **Severity**: 🟠 High (*Impedes × Common*)
- **Confidence**: Code-confirmed. The schema overrides every rule's message with a generic "Invalid input" ([`SignupForm.tsx:22`](../../src/components/auth/SignupForm.tsx#L22)); server errors render the raw status code ([`ValidationBanner.tsx:9`](../../src/components/auth/ValidationBanner.tsx#L9)).
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: A
- **Location**: [`src/components/auth/SignupForm.tsx:22`](../../src/components/auth/SignupForm.tsx#L22)
- **Persona**: **Front-desk Rachel**: sees "Invalid input" after submitting, and must guess which of six fields is wrong and why.

**Problem.** Error messages must say what happened and how to recover (Nielsen #9, WCAG 3.3.3). Validation errors are a common state on any signup form, so this hits many users.

**Recommendation.** Write each error as *what's wrong + how to fix it*, in the product's voice.

| Where | Current | Proposed |
| :--- | :--- | :--- |
| Email, invalid format | "Invalid input" | "Enter an email address like name@clinic.com" |
| Password, too short | "Invalid input" | "Use at least 12 characters" |
| Server 409 | "Error 409" | "This email already has an account. [Sign in] or [reset your password]." |
| Server 5xx | "Error 500" | "We couldn't create your account right now. Your details are still here. Try again in a moment." |

**Acceptance criteria**
- [ ] No user-facing message contains "Invalid input" or a raw status code.
- [ ] Each message names the field and the action needed to fix it.

---

### `[FORM-01]` Placeholder text is the only label on all 6 fields

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. `AuthInput` renders a bare `<input>` with `placeholder` and no `<label>`. All 6 signup fields use it.
- **Effort**: Low · **Priority**: Now · **Theme**: A
- **Location**: [`src/components/auth/AuthInput.tsx:18`](../../src/components/auth/AuthInput.tsx#L18)
- **Persona**: **Front-desk Rachel**: is interrupted mid-form by a patient; when she returns, the filled fields no longer say what they are. **Dr. Omar**: with large text on his phone, long placeholders are truncated before he starts typing.

**Problem.** Placeholders disappear on input, so users lose context and can't check their answers. It is widely treated as a failure of WCAG 3.3.2 (Labels or Instructions). One component causes it everywhere, so this is one finding with 6 instances.

**Recommendation.** Render a persistent visible label above each input. The systemic version is the Theme A field component.

```diff
- export function AuthInput({ name, placeholder, type, autoComplete, register }: AuthInputProps) {
+ export function AuthInput({ name, label, placeholder, type, autoComplete, register }: AuthInputProps) {
    return (
-     <input id={name} type={type} autoComplete={autoComplete} placeholder={placeholder}
-       className="w-full rounded-md border px-3 py-2" {...register(name)} />
+     <div className="space-y-1.5">
+       <label htmlFor={name} className="text-sm font-medium">{label}</label>
+       <input id={name} type={type} autoComplete={autoComplete} placeholder={placeholder}
+         className="w-full rounded-md border px-3 py-2" {...register(name)} />
+     </div>
    )
  }
```

**Acceptance criteria**
- [ ] Every field shows a visible label before, during, and after typing.
- [ ] Clicking a label focuses its input.

---

### `[A11Y-01]` Errors aren't announced or associated with their fields

- **Severity**: 🟠 High (*Impedes × Common*)
- **Confidence**: Code-confirmed. Errors render only in `ValidationBanner`, which has no `role="alert"` or live region. Inputs set neither `aria-invalid` nor `aria-describedby`, so when react-hook-form moves focus to the first invalid field, only the field is announced, not the error.
- **Effort**: Low · **Priority**: Now · **Theme**: A
- **Location**: [`src/components/auth/ValidationBanner.tsx:5`](../../src/components/auth/ValidationBanner.tsx#L5)
- **Persona**: **Dr. Omar**: submits with VoiceOver on. Focus jumps to the email field, but VoiceOver reads only "Email, edit text". Nothing tells him it is wrong or why.

**Problem.** Fails WCAG 3.3.1 (Error Identification) and 4.1.3 (Status Messages). Sighted users also have to scroll up to the banner and work out which field it means.

**Recommendation.** Show each error next to its field and link it programmatically, so it is announced when focus lands on the field. The shadcn `FormMessage` (Theme A) does the wiring automatically. Without it:

```diff
-       <input id={name} ... {...register(name)} />
+       <input id={name} ... aria-invalid={!!error} aria-describedby={error ? `${name}-error` : undefined} {...register(name)} />
+       {error && <p id={`${name}-error`} className="text-sm text-destructive">{error.message}</p>}
```
Keep `ValidationBanner` only for server errors, with `role="alert"`.

**Acceptance criteria**
- [ ] After a failed submit, focus moves to the first invalid field, and a screen reader reads its label and error.
- [ ] Each error appears directly below its field.
- [ ] Server errors are announced without moving focus.

---

### `[COLOR-01]` Email hint text is 2.53:1 contrast

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Code-confirmed. `text-gray-400` resolves to `#9ca3af` on white: **2.53:1** via `contrast.js`. WCAG 1.4.3 requires 4.5:1 for 14px text.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: B
- **Location**: [`src/components/auth/SignupForm.tsx:47`](../../src/components/auth/SignupForm.tsx#L47)
- **Persona**: **Dr. Omar**: can't read "Use your work email — we'll send the invite confirmation there" on his phone in a bright corridor.

**Problem.** Fails WCAG 1.4.3. The hint is supplementary, so the task can still be completed: Medium, not High. It would be High if it carried required information.

**Recommendation.**
```diff
- <p className="text-sm text-gray-400">Use your work email — we'll send the invite confirmation there</p>
+ <p className="text-sm text-muted-foreground">Use your work email — we'll send the invite confirmation there</p>
```
`text-muted-foreground` resolves to `#64748b`: **4.75:1**, which passes.

**Acceptance criteria**
- [ ] All hint text on the screen measures ≥ 4.5:1.

---

### `[FLOW-01]` Invited staff must enter a clinic NPI they don't have

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. `clinicNpi` is required in the zod schema ([`SignupForm.tsx:16`](../../src/components/auth/SignupForm.tsx#L16)) and rendered for every signup, including invite links (`?invite=` is read at [`page.tsx:9`](../../src/app/(auth)/signup/page.tsx#L9) but never used to change the form).
- **Effort**: Medium · **Priority**: Next · **Theme**: —
- **Location**: [`src/components/auth/SignupForm.tsx:58`](../../src/components/auth/SignupForm.tsx#L58)
- **Persona**: **Front-desk Rachel**: opens the invite from her manager, reaches "Clinic NPI number (required)", doesn't know it, and leaves to ask, often never coming back. This matches the reported invited-staff drop-off.

**Problem.** Users must not be asked for information they don't have at that moment. The clinic is already known from the invite, so this field adds friction and no information. It is the most likely cause of the drop-off the team reported.

**Recommendation.** Split the form into two paths. This is a flow change, so it is specified as a design spec rather than a diff:

1. **Invite path** (`?invite=<token>`): look up the invite, hide the NPI field, and show a context line confirming the clinic.
2. **Owner path** (no invite): keep NPI, add a hint saying where to find it, and allow "Add later" if onboarding permits.

```text
┌──────────────────────────────────────┐
│  Join Riverside Family Clinic        │  ← from invite token
│  Invited by Maria Chen               │
│                                      │
│  Full name      [                  ] │
│  Work email     [ rachel@river...  ] │  ← pre-filled from invite
│  Password       [                  ] │
│                                      │
│  [ Create account ]                  │
└──────────────────────────────────────┘
```

**Acceptance criteria**
- [ ] Opening an invite link shows the clinic name and no NPI field.
- [ ] The invited email is pre-filled and editable.
- [ ] The owner path still collects NPI, with a hint on where to find it.
- [ ] Track invite-signup completion rate before and after the change.

---

### `[DSYS-01]` Submit button uses hard-coded color and radius

- **Severity**: 🔵 Low (*Cosmetic × Core*)
- **Confidence**: Code-confirmed. `SubmitButton` uses `bg-[#2563eb]` and `rounded-[7px]`; the shared `<Button>` uses `bg-primary` and `rounded-md`. The token inventory confirms these are the only arbitrary color and radius values in the auth components.
- **Effort**: ⚡ Quick Win · **Priority**: Next · **Theme**: B
- **Location**: [`src/components/ui/SubmitButton.tsx:10`](../../src/components/ui/SubmitButton.tsx#L10)
- **Persona**: **Front-desk Rachel**: no task impact. The button looks slightly different from every other button in the app, and won't follow theme or dark-mode changes.

**Problem.** Two button implementations will keep drifting apart. Contrast currently passes (white on `#2563eb` is 5.16:1), so this is polish, not an accessibility issue.

**Recommendation.** Delete `SubmitButton` and use the shared `<Button>`, carrying over the pending behavior from `[PERF-01]`.
```diff
- <SubmitButton pending={formState.isSubmitting} pendingLabel="Creating account…">Create account</SubmitButton>
+ <Button type="submit" disabled={formState.isSubmitting}>
+   {formState.isSubmitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
+   {formState.isSubmitting ? "Creating account…" : "Create account"}
+ </Button>
```

**Acceptance criteria**
- [ ] No arbitrary color or radius values remain in `src/components/auth/` (verified with `token_inventory.js`).

---

## To Verify

| Suspected issue | Why it is uncertain | How to confirm |
| :--- | :--- | :--- |
| An expired invite token may discard everything the user typed | Token lifetime and expiry handling live in the auth service, not this repo | Open an invite, wait past the token's lifetime, then submit. Check whether entered data and a clear message survive. |

---

## Coverage

| Category | Status | Findings |
| :--- | :--- | :--- |
| `HIER` Visual hierarchy | Evaluated | — |
| `TYPO` Typography | Evaluated | — |
| `COLOR` Color & contrast | Evaluated | `[COLOR-01]` |
| `DSYS` Design system | Evaluated | `[DSYS-01]` |
| `MOTION` Motion | Evaluated: only hover color transitions; nothing animates on load | — |
| `COPY` Content & microcopy | Evaluated | `[COPY-01]` |
| `STATE` Empty/loading/error | Evaluated | covered by `[PERF-01]`, `[COPY-01]` |
| `I18N` Localization & resilience | Evaluated: English-only product; single "Full name" field handles international names | — |
| `NAV` Navigation | Evaluated | — |
| `AFFORD` Affordance & targets | Partial: target sizes computed from classes (40px buttons), not measured in a browser | — |
| `FORM` Forms | Evaluated | `[FORM-01]` |
| `FLOW` Task flow | Evaluated | `[FLOW-01]` |
| `COGN` Cognitive load | Evaluated | — |
| `SRCH` Search & filtering | N/A: no search in this flow | — |
| `DATA` Data display | N/A: no tables or charts | — |
| `TRUST` Feedback & error prevention | Evaluated | — |
| `A11Y` Accessibility | Partial: screen-reader output inferred from markup, not tested | `[A11Y-01]` |
| `PERF` Perceived performance | Evaluated | `[PERF-01]` |
| `ETHIC` Dark patterns | Evaluated: terms checkbox is not pre-checked; no pricing in this flow | — |
| `PLAT` Platform conventions | Partial: mobile layout not rendered | — |
| `ONBD` Onboarding | Evaluated | see `[FLOW-01]` |
| `PERS` Persistence | N/A: single short form | — |

---

## Appendix

### Personas
- **Front-desk Rachel**: Receptionist invited by her practice manager. Completes signup on the shared reception desktop between patients, so she's frequently interrupted. Keyboard-heavy, moderate technical comfort, doesn't know clinic administrative details such as the NPI.
- **Dr. Omar**: Clinician signing up on his iPhone between appointments. Has low vision: uses large Dynamic Type and sometimes VoiceOver. Low patience for forms, often in bright corridors.

### Walkthrough

| Step | Persona | Question that failed | Finding |
| :--- | :--- | :--- | :--- |
| 1. Open invite, fill the form | Front-desk Rachel | Will they try to do the right thing? Labels vanish after an interruption | `[FORM-01]` |
| 1. Fill the form | Front-desk Rachel | Will they try to do the right thing? She doesn't have the clinic NPI | `[FLOW-01]` |
| 2. Submit | Front-desk Rachel | Will they see progress? No feedback for 2–4 s | `[PERF-01]` |
| 3. Fix errors | Dr. Omar | Will they see progress? The error isn't announced or tied to the field | `[A11Y-01]`, `[COPY-01]` |

### Files Reviewed
- [`src/app/(auth)/signup/page.tsx`](../../src/app/(auth)/signup/page.tsx)
- [`src/components/auth/SignupForm.tsx`](../../src/components/auth/SignupForm.tsx)
- [`src/components/auth/AuthInput.tsx`](../../src/components/auth/AuthInput.tsx)
- [`src/components/auth/ValidationBanner.tsx`](../../src/components/auth/ValidationBanner.tsx)
- [`src/components/auth/TermsDialog.tsx`](../../src/components/auth/TermsDialog.tsx)
- [`src/components/ui/SubmitButton.tsx`](../../src/components/ui/SubmitButton.tsx)
- [`src/components/ui/dialog.tsx`](../../src/components/ui/dialog.tsx)
- [`src/app/globals.css`](../../src/app/globals.css)

### Method & Evidence
- **Passes**: Task walkthrough · State inventory · Heuristic sweep (22 categories) · Accessibility (WCAG 2.2 AA) · Visual craft review · Content review. Source-only, so rendered checks did not run.
- **Token inventory** (`src/components/auth`, `src/components/ui/SubmitButton.tsx`): 2 neutral palettes (`gray`, `slate`); 3 arbitrary values (`bg-[#2563eb]`, `rounded-[7px]`, `text-[13px]`); semantic color classes used 4× vs. raw palette classes 9×.
- **Contrast checks** (`contrast.js`): `#9ca3af` on `#ffffff` = 2.53:1 (fail); `--muted-foreground` (`#64748b`) on `#ffffff` = 4.75:1 (pass); `#ffffff` on `#2563eb` = 5.16:1 (pass).
- **Checked & cleared**:
  - *Terms dialog focus trap*: provided by Radix `Dialog`; `DialogTitle` is present.
  - *`outline-none` on `SubmitButton`*: paired with `focus-visible:ring-2`, so a visible focus indicator remains.
  - *Focus after failed submit*: react-hook-form's default `shouldFocusError: true` already moves focus to the first invalid field through the registered ref.
  - *Validation timing*: react-hook-form runs in its default `onSubmit` mode with `onChange` revalidation, which is the recommended timing.
````
