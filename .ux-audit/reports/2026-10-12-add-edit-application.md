# UX Audit — Add & Edit Application Flow

**Date:** 2026-10-12 · **Mode:** Source + Interactive (mock DB, Playwright at 1440/768/375, light and dark) · **Flow slug:** `add-edit-application`
**Entry points:** "New Application" button / mobile FAB / `/applications/new` → create dialog; row pencil → edit dialog; detail sheet → "Edit Details" (inline form)

## Verdict

The link-first create flow is well designed: paste a link, review the autofilled fields, and save, with a fallback that keeps your link if extraction fails. The biggest weakness is that **unsaved work is easy to lose without warning**. The discard guard runs only on the Cancel button. Pressing Esc, clicking outside, clicking the ✕, using the detail sheet's J/K navigation, or using Cancel from the link step all close the form without asking. Next most important: the create form clears the user's filters and view after every save, and form error text fails WCAG AA contrast. Visually, the form is clean but doesn't follow one consistent style. Error messages are the largest text in the form and make it reflow, field boundaries are close to invisible in dark mode, and neighbouring fields use two different text sizes.

## Scorecard

| Visual | Content | Flow | Trust | A11y | Platform |
|---|---|---|---|---|---|
| 3 | 3 | 3 | 2 | 2 | 3 |

## Top 3 Priorities

1. **Never drop unsaved input without asking.** Route every dismissal path through the existing discard dialog (TRUST-03, TRUST-04, FORM-02).
2. **Keep the user where they were after adding an application.** Stop `router.push("/applications")` from resetting filters and view (FLOW-01).
3. **Make the form read as one calm system.** Make errors quieter, readable and attached to their fields (TYPO-01, COLOR-02), give fields visible boundaries (COLOR-03), and use one type scale (DSYS-01, PLAT-01). Then make the data honest (TRUST-05, FORM-01).

## Counts

🔴 0 · 🟠 2 · 🟡 8 · 🔵 8 — **18 findings** (all New), 9 Quick Wins, 1 to verify.

## Personas

- **Maya, active job seeker (desktop, high volume).** Logs 5–15 applications a day from LinkedIn and Greenhouse links, works fast, relies on keyboard and Esc, and keeps the table filtered to "This week / Applied".
- **Dan, mobile on the go (iPhone Safari).** Adds an application from a phone right after applying in the LinkedIn app, one-handed, often interrupted.
- **Priya, keyboard and screen-reader user.** Uses NVDA with Chrome, never uses a mouse, and depends on announced state changes and readable error text.
- **Sam, pipeline updater.** Opens the detail sheet, moves through applications with J/K, and edits details as interviews progress.

---

## Findings

### [TRUST-03] Create and edit dialogs close on Esc, outside click, or ✕ with no discard prompt
- **Severity:** 🟠 High (*Loses data × Core*) · **Confidence:** Observed (Esc closed an edit dialog that React Hook Form reported as dirty, with no prompt) · **Effort:** Low · **Priority:** Now · **Theme:** Unsaved-work safety
- **Location:** [data-table.tsx#L168](../../app/(pages)/applications/data-table.tsx#L168), [edit-application-sheet.tsx#L58](../../app/_components/edit-application-sheet.tsx#L58), guard only in [application-form.tsx#L146](../../app/_components/application-form.tsx#L146)
- **Persona:** Maya autofills a posting, fixes the location, writes notes, then presses Esc to close the calendar popover. A second Esc, or a stray click on the backdrop, closes the whole dialog and everything is gone. Dan's thumb brushes the dimmed backdrop on a phone and the same thing happens.
- **Problem:** `Dialog onOpenChange={setIsCreateOpen}` and `onOpenChange={setOpen}` close immediately. The `isDirty` and session-upload check (`onCancel`) is wired only to the Cancel button. The existing e2e test (`applications-dirty-guard.spec.ts`) covers only Cancel. Radix unmounts the content when it closes, so the input and any uploaded resume are lost (and the resume is never cleaned up). This violates error prevention (Nielsen #5).
- **Recommendation:** Every close path should go through the same guard. Let `ApplicationForm` own the decision and expose a `requestClose`:
  ```diff
  // application-form.tsx: report dirty state upward
  +type Props = { ...; onDirtyChange?: (dirty: boolean) => void };
  +useEffect(() => { onDirtyChange?.(form.formState.isDirty || sessionUploadedDocIds.length > 0) },
  +  [form.formState.isDirty, sessionUploadedDocIds.length]);
  ```
  ```diff
  // data-table.tsx and edit-application-sheet.tsx
  -<DialogContent className="...">
  +<DialogContent
  +  className="..."
  +  onEscapeKeyDown={(e) => { if (isFormDirty) { e.preventDefault(); setDiscardOpen(true); } }}
  +  onInteractOutside={(e) => { if (isFormDirty) { e.preventDefault(); setDiscardOpen(true); } }}
  +>
  ```
  Also intercept the ✕ button by passing `onOpenChange={(o) => !o && isFormDirty ? setDiscardOpen(true) : setOpen(o)}`. Reuse the existing "Discard Unsaved Changes?" dialog; don't add a second one.
- **Acceptance criteria:** With any field changed, Esc, a backdrop click, and ✕ each open the discard dialog in both create and edit. "Keep Editing" returns to the form with all values intact. "Discard" also deletes resumes uploaded in that session. With no changes, all three close immediately. An e2e test covers Esc and backdrop.

### [TRUST-04] Detail-sheet inline edit discards changes on close or J/K navigation
- **Severity:** 🟠 High (*Loses data × Common*) · **Confidence:** Code-confirmed · **Effort:** Low · **Priority:** Now · **Theme:** Unsaved-work safety
- **Location:** [application-detail-sheet.tsx#L318](../../app/(pages)/applications/components/application-detail-sheet.tsx#L318) (`requestClose`), [#L389](../../app/(pages)/applications/components/application-detail-sheet.tsx#L389) (J/K/arrow handler), [#L775](../../app/(pages)/applications/components/application-detail-sheet.tsx#L775)
- **Persona:** Sam clicks "Edit Details", changes the status and salary, then presses Esc or ✕, or presses `j` while focus is on the status Select trigger or the date button. The sheet closes, or jumps to the next application, and the edits are gone with no prompt.
- **Problem:** The sheet's guards (`requestClose`, `requestNext`, `requestPrevious`, `onPointerDownOutside`) check the sheet's own `isDirty` draft state. That state doesn't change while the embedded `ApplicationForm` is being edited. The J/K/ArrowUp/ArrowDown listener ignores only INPUT and TEXTAREA targets, so key presses on buttons such as the Select trigger, date trigger, or "Add More Details" still navigate. When the next app loads, the `initialApp` effect calls `setIsEditing(false)` and the form unmounts.
- **Recommendation:** Treat "inline form dirty" as dirty for the sheet, and turn off list navigation while editing:
  ```diff
  -const requestClose = useCallback(() => { if (isDirty) {
  +const isAnyDirty = isDirty || (isEditing && isFormDirty); // isFormDirty via ApplicationForm onDirtyChange
  +const requestClose = useCallback(() => { if (isAnyDirty) {
  ...
   useEffect(() => {
  -  if (!open) return;
  +  if (!open || isEditing) return;
  ```
  Hide or disable the prev/next chevrons while `isEditing` too.
- **Acceptance criteria:** In inline edit mode with a changed field, Esc, ✕, and an outside click show the guard dialog. J/K and the arrow keys do nothing while editing. "Discard" leaves edit mode without saving.

### [FLOW-01] Adding or cancelling a new application resets the table's filters and view
- **Severity:** 🟡 Medium (*Impedes × Core*) · **Confidence:** Code-confirmed · **Effort:** ⚡ Quick Win · **Priority:** Now
- **Location:** [application-form.tsx#L141](../../app/_components/application-form.tsx#L141), [application-form.tsx#L227](../../app/_components/application-form.tsx#L227)
- **Persona:** Maya has the table filtered to `?view=table&status=applied&q=react` and adds three applications in a row. After each save, or each cancel, she's sent back to bare `/applications` and has to rebuild her filters every time.
- **Problem:** `handleCloseForm` and the success path both call `router.push("/applications")` for new applications. The `create` query param is already cleared by `use-data-table.ts` (`setCreateParam(null)`), so the push serves no purpose. It wipes nuqs URL state and adds a history entry, which breaks the Back button. This breaks user control and freedom.
- **Recommendation:** Delete both `router.push("/applications")` calls (and the `useRouter` import if nothing else uses it). The create dialog only ever renders on `/applications`.
- **Acceptance criteria:** After you save or cancel a new application, the URL query string (view, filters, search, page) is unchanged and Back doesn't revisit a duplicate entry. `/applications/new` still opens the dialog.

### [FORM-01] "Date Applied" is marked required but isn't validated, and the picker doesn't close after a choice
- **Severity:** 🟡 Medium (*Misleads × Common*) · **Confidence:** Code-confirmed · **Effort:** Low · **Priority:** Next
- **Location:** [application-form.tsx#L59](../../app/_components/application-form.tsx#L59) (`date_applied: z.any()`), [lib/utils.ts#L350](../../lib/utils.ts#L350), [application-form-fields.tsx#L233](../../app/_components/application-form-fields.tsx#L233)
- **Persona:** Maya opens the calendar and clicks the already selected date to confirm it. In `mode="single"` that deselects it, so the field shows "Pick a date". She saves anyway and the record silently gets today's date. Separately, after she clicks "Yesterday" or a day, the popover stays open and she has to click away to dismiss it.
- **Problem:** The field has a red asterisk but the schema accepts anything. `safeFormatDate(undefined)` then falls back to `new Date()`, so a backdated application is quietly mislabeled and the velocity analytics are skewed. Not closing the popover on selection breaks the date-picker convention users expect (Jakob's Law).
- **Recommendation:** Make the schema match the asterisk, and close on choice:
  ```diff
  -date_applied: z.any(),
  +date_applied: z.union([z.date(), z.string().min(1)], { message: "Pick the date you applied." }),
  ```
  ```diff
  -<Popover>
  +<Popover open={dateOpen} onOpenChange={setDateOpen}>
   ...
  -onSelect={field.onChange}
  +onSelect={(d) => { if (d) { field.onChange(d); setDateOpen(false); } }}
  ```
  Close the popover from the Today, Yesterday, and 1 week ago buttons too. Ignoring an `undefined` selection keeps the user from clearing the date by accident.
- **Acceptance criteria:** Clicking the selected date doesn't clear it. Picking a date or a preset closes the popover and returns focus to the trigger. Submitting with no date shows an inline error.

### [TRUST-05] Autofill invents "Remote" when the posting has no location
- **Severity:** 🟡 Medium (*Misleads × Common*) · **Confidence:** Code-confirmed · **Effort:** ⚡ Quick Win · **Priority:** Now
- **Location:** [link-autofill-bar.tsx#L92](../../app/_components/link-autofill-bar.tsx#L92)
- **Persona:** Dan pastes an onsite LinkedIn posting whose location the extractor missed. The banner says "Autofilled from linkedin.com", Location reads "Remote", and he saves without noticing. His remote vs. onsite analytics are now wrong.
- **Problem:** `location: aiData.application.location || "Remote"` presents a guess as extracted data. Location is required, so leaving it empty would make the user fill it in. The fallback quietly avoids that check. This undermines trust in every autofilled value.
- **Recommendation:** Use `location: aiData.application.location || ""` so the required-field validation shows "Location is required" and the user notices. Optionally add a line under the banner: "Couldn't find: Location. Please fill it in."
- **Acceptance criteria:** When extraction returns no location, the Location field is empty and shows its validation message. Fields that were extracted are unaffected.

### [COLOR-02] Validation error text fails WCAG AA contrast in both themes
- **Severity:** 🟡 Medium (*Impedes × Common*, WCAG 1.4.3) · **Confidence:** Code-confirmed (measured with `contrast.js`) · **Effort:** ⚡ Quick Win · **Priority:** Now
- **Location:** [components/ui/form.tsx#L166](../../components/ui/form.tsx#L166) (`FormMessage text-destructive`), [form.tsx#L103](../../components/ui/form.tsx#L103) (label turns red), tokens at [globals.css#L80](../../app/globals.css#L80) and [#L127](../../app/globals.css#L127)
- **Persona:** Priya, and anyone with low vision or on a phone in glare, can't reliably read "Company name must be at least 2 characters."
- **Problem:** Light: `--destructive` `#ef4343` on the white card is **3.78:1** (needs 4.5:1 for 14px text). Dark: `0 72% 54%` on the card `#14171f` is **3.99:1**. The 12px labels also turn this color on error. This is a theme-level issue, so it affects every form in the app.
- **Recommendation:** Light `--destructive: 0 74% 45%` (`#c81e1e`, **5.75:1**; `--destructive-foreground` on it is still 5.5:1). Dark: add a text-specific token, e.g. `--destructive-text: 0 90% 66%` (**5.59:1** on the card). Use it for `FormMessage` and error labels so destructive buttons keep their current fill.
- **Acceptance criteria:** `contrast.js` reports ≥4.5:1 for error message and label text against the dialog background in both themes.

### [PLAT-01] On iOS, form inputs render at 12px, so Safari zooms in on every focus
- **Severity:** 🟡 Medium (*Impedes × Common* on mobile) · **Confidence:** Code-confirmed · **Effort:** Low · **Priority:** Next
- **Location:** [application-form-fields.tsx#L354](../../app/_components/application-form-fields.tsx#L354) and every `className="h-9 text-xs"` / `text-xs` on Input, Textarea, and ComboboxInput in that file; [link-autofill-bar.tsx#L183](../../app/_components/link-autofill-bar.tsx#L183); base at [components/ui/input.tsx#L11](../../components/ui/input.tsx#L11)
- **Persona:** Dan taps Role Title and Safari zooms the page. The modal's footer buttons end up off screen and he has to pinch out after every field.
- **Problem:** The base Input uses `text-base md:text-sm` precisely to avoid iOS zoom. `tailwind-merge` drops `text-base` when `text-xs` is passed, but `md:text-sm` survives, so below 768px the font is 12px. iOS zooms on focus for any input under 16px.
- **Recommendation:** Pass the size responsively in this form: `className="h-9 text-base sm:text-xs"` (or remove the override). Same for the Textareas, ComboboxInput, and the link URL input.
- **Acceptance criteria:** At 375px width every text input and textarea in the create, edit, and link steps computes `font-size: 16px`, and iOS Safari doesn't zoom on focus. Desktop sizing is unchanged.

### [FORM-02] Cancel on the link step skips the discard guard
- **Severity:** 🟡 Medium (*Loses data × Edge*) · **Confidence:** Code-confirmed · **Effort:** ⚡ Quick Win · **Priority:** Next · **Theme:** Unsaved-work safety
- **Location:** [application-form.tsx#L246](../../app/_components/application-form.tsx#L246)
- **Persona:** Maya enters details manually, uploads a resume, then clicks "Back to link autofill" (or "Paste different link") to try a URL. She decides against it and clicks Cancel there. The dialog closes and her values are lost, and the uploaded resume stays in her library without being attached.
- **Problem:** `onCancel={() => handleCloseForm(false)}` doesn't check `isDirty` or `sessionUploadedDocIds`, unlike the manual step's `onCancel`.
- **Recommendation:** Pass the guarded handler: `onCancel={onCancel}`. The form state persists across modes, so the existing dialog and its upload cleanup work unchanged.
- **Acceptance criteria:** From the link step, after manual changes or a resume upload, Cancel shows "Discard Unsaved Changes?". On a fresh, unchanged dialog, Cancel closes immediately.

### [COPY-01] Labels and error messages use different terms, and the guard copy doesn't fit new applications
- **Severity:** 🔵 Low (*Hesitation × Common*) · **Confidence:** Code-confirmed · **Effort:** ⚡ Quick Win · **Priority:** Later
- **Location:** [application-form.tsx#L53-L87](../../app/_components/application-form.tsx#L53), [application-form.tsx#L355](../../app/_components/application-form.tsx#L355)
- **Persona:** Priya hears "Role name must be at least 2 characters" while focused on a field labelled "Role Title". A user applying to "X" or "Q" can't save at all.
- **Problem:** The labels and errors don't match: Role Title / "Role name", Platform / "Platform name", Custom Stage Name / "Status name". The 2-character minimum rejects real one-letter company names. When you discard a new application, the dialog says "You have modified this job application", which reads oddly.
- **Recommendation:**

  | Field | Current | Proposed |
  |---|---|---|
  | role_name | Role name must be at least 2 characters. | Enter the role title. |
  | company_name (min 1) | Company name must be at least 2 characters. | Enter the company name. |
  | platform | Platform name must be at least 2 characters. | Enter where you applied (e.g. LinkedIn). |
  | location | Location must be at least 2 characters. | Enter a location, or "Remote". |
  | status | Status name must be at least 2 characters. | Enter a stage name, or choose "Use standard only". |
  | discard (create) | You have modified this job application… | This application hasn't been saved. Discard it? |
- **Acceptance criteria:** Every error message names the field exactly as its label does. A one-character company name saves.

### [A11Y-04] The Save button's pending state is an unlabeled spinner
- **Severity:** 🔵 Low (*Hesitation × Common* for AT users, WCAG 4.1.3) · **Confidence:** Code-confirmed · **Effort:** ⚡ Quick Win · **Priority:** Later
- **Location:** [application-form.tsx#L330](../../app/_components/application-form.tsx#L330)
- **Persona:** Priya presses Enter to save. The button's text becomes an icon with no name, so NVDA announces nothing until the toast appears, if it's announced at all.
- **Recommendation:** Swap the icon for `<Loader2 className="size-4 animate-spin" aria-hidden /> Saving…` (create: "Adding…"), keeping the button width stable.
- **Acceptance criteria:** While pending, the button's accessible name is "Saving…" or "Adding…".

### [AFFORD-02] An autofill extraction can't be cancelled
- **Severity:** 🔵 Low (*Hesitation × Common*) · **Confidence:** Code-confirmed · **Effort:** Low · **Priority:** Later
- **Location:** [link-autofill-bar.tsx#L238](../../app/_components/link-autofill-bar.tsx#L238), route `maxDuration = 30`
- **Persona:** Dan pastes a slow Workday link. For up to 30s the input, Paste, Cancel, and "enter manually" are all disabled, and the only feedback is "Extracting…".
- **Recommendation:** Keep Cancel and "or enter details manually" enabled during extraction, and abort the `fetch` with an `AbortController`. Going manual keeps the URL. After about 5s, add "This can take up to 30 seconds."
- **Acceptance criteria:** During extraction, "enter details manually" switches to the form immediately with the link prefilled, and the request is aborted.

### [FORM-03] The platform name is lowercased on save
- **Severity:** 🔵 Low (*Cosmetic × Common*) · **Confidence:** Observed (the table shows "Wellfound" but the edit form shows "wellfound"; see `light-1440-edit.png`) · **Effort:** Low · **Priority:** Later
- **Location:** [application-form.tsx#L216](../../app/_components/application-form.tsx#L216)
- **Persona:** Maya types "LinkedIn", picked from the suggestions. When she reopens Edit, the field shows "linkedin", and the custom platform "WeWorkRemotely" comes back as "weworkremotely".
- **Recommendation:** Store a canonical display form instead: match case-insensitively against `mergedPlatforms` and save that option's label, otherwise keep what the user typed. If grouping needs it, normalize case only in the analytics queries.
- **Acceptance criteria:** A platform saved as "LinkedIn" shows "LinkedIn" in the edit form and the table.

## Layout & Visual Findings (Interactive pass)

Screenshots are in [`.ux-audit/screenshots/2026-10-12-add-edit/`](../screenshots/2026-10-12-add-edit/), named `{light,dark}-{1440,768,375}-{create-link,create-manual,create-errors,create-more,create-date,edit,edit-bottom}.png`.

### [TYPO-01] Error messages are bigger and louder than the fields they describe, and they reflow the grid
- **Severity:** 🟡 Medium (*Hesitation × Core*) · **Confidence:** Observed (`light-1440-create-errors.png`, `light-375-create-errors.png`) · **Effort:** ⚡ Quick Win · **Priority:** Now · **Theme:** Form visual system
- **Location:** [components/ui/form.tsx#L166](../../components/ui/form.tsx#L166) (`FormMessage` uses `text-sm font-medium`); labels are overridden to `text-xs` in [application-form-fields.tsx#L345](../../app/_components/application-form-fields.tsx#L345)
- **Persona:** Maya clicks "Add Application" too early. Four red sentences appear: 14px on desktop and 16px on mobile, under 12px labels. Each two-column row grows by two wrapped lines, the Status row jumps down about 50px, and the form looks broken rather than incomplete.
- **Problem:** The error text is the largest text in the form, so it outweighs both the label and the value it refers to. In the half-width columns every message wraps to two lines, which shifts the layout. The field itself gets no invalid styling: `FormControl` sets `aria-invalid`, but nothing in `Input`, `ComboboxInput` or `SelectTrigger` styles that state. The only cue is red text.
- **Recommendation:** Make errors a quiet annotation and mark the field itself:
  ```diff
  // components/ui/form.tsx (FormMessage)
  -className={cn("text-sm font-medium text-destructive", className)}
  +className={cn("text-[11px] leading-4 font-medium text-destructive", className)}
  ```
  ```diff
  // components/ui/input.tsx (and the SelectTrigger / Textarea bases)
  +"aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-destructive/15",
  ```
  Use the shorter wording from COPY-01 so each message fits on one line in a half-width column.
- **Acceptance criteria:** At 1440, 768 and 375 px, each error fits on one line in its column and is no larger than its label, and the invalid field shows a red border.

### [COLOR-03] Field boundaries are nearly invisible, especially in dark mode
- **Severity:** 🟡 Medium (*Impedes × Common*, WCAG 1.4.11) · **Confidence:** Observed and measured · **Effort:** Low · **Priority:** Next · **Theme:** Form visual system
- **Location:** [components/ui/input.tsx#L11](../../components/ui/input.tsx#L11) (`bg-slate-100/80 border-slate-200/90 dark:bg-muted/30 dark:border-border/40`)
- **Persona:** Priya uses dark mode with a low-vision zoom setting and can't see where the empty Company Name field is (`dark-1440-create-errors.png`). Dan has the same problem on his phone in sunlight.
- **Problem:** In dark mode the input fill is 1.03:1 against the card (`#171a22` on `#14171f`). In light mode the fill is 1.09:1 against white. The borders are just as faint. WCAG 1.4.11 requires 3:1 for the visual boundary of a control. Empty fields only read as fields because of their placeholder text.
- **Recommendation:** Give inputs a real border. In light mode use `border-slate-300` (or set the `--input` token to at least 3:1 against the card). In dark mode use something like `dark:border-[hsl(224_12%_32%)]`, or a new `--input` value that `contrast.js` confirms is at least 3:1 against `--card`. Apply the same border to the Select, date and Textarea triggers so every field has the same boundary style.
- **Acceptance criteria:** `contrast.js` reports at least 3:1 between the input border and `--card` in both themes, and an empty field is identifiable without its placeholder.

### [DSYS-01] Text sizes and surfaces differ between fields in the same form
- **Severity:** 🔵 Low (*Cosmetic × Core*) · **Confidence:** Observed (`light-1440-edit.png`) · **Effort:** Low · **Priority:** Next · **Theme:** Form visual system
- **Location:** [application-form-fields.tsx](../../app/_components/application-form-fields.tsx) (`h-9 text-xs` on the Inputs vs. the SelectTrigger and date Button), [link-autofill-bar.tsx#L221](../../app/_components/link-autofill-bar.tsx#L221)
- **Persona:** Maya notices the form looks "off". Role Title and Platform values render at 14px, while Status, Date Applied and Resume, right next to them, render at 12px.
- **Problem:** On desktop, `md:text-sm` from the Input base survives the `text-xs` override, so text inputs and comboboxes are 14px while Select and Button-based fields are 12px. The date trigger uses `bg-background/60` while inputs use `bg-slate-100/80`. The two steps of the create dialog also use different footers. The link step has small, right-aligned `h-9` buttons inline with a text link. The manual step has a full-width bar pinned to the bottom, with Cancel taking a third of the width. Placeholder style is mixed too: "Frontend Developer" vs. "e.g. Acme Corp".
- **Recommendation:** Pick one size for field text (e.g. `text-base sm:text-sm`, which also fixes PLAT-01). Set it in the base classes of Input, Textarea, ComboboxInput, SelectTrigger and the date trigger, not in each call's `className`. Give the link step the same pinned footer as the manual step (Cancel at a third of the width, Autofill at two thirds), with "Enter details manually" as a full-width text button above it. Start every placeholder with "e.g.".
- **Acceptance criteria:** Every field value in the form has the same computed font size and background at each breakpoint, and both steps use the same footer layout.

### [HIER-02] On mobile, "enter details manually" is squeezed between the buttons, and the dialog mixes text alignments
- **Severity:** 🔵 Low (*Hesitation × Common* on mobile) · **Confidence:** Observed (`light-375-create-link.png`) · **Effort:** Low · **Priority:** Later
- **Location:** [link-autofill-bar.tsx#L221](../../app/_components/link-autofill-bar.tsx#L221); dialog header in [data-table.tsx#L170](../../app/(pages)/applications/data-table.tsx#L170)
- **Persona:** Dan has no link because the referral came by email. The only alternative is a gray "or enter details manually →" that wraps onto two lines between the dialog edge and the Cancel button, and he misses it.
- **Problem:** On a phone the header is centered (shadcn's `text-center sm:text-left`) while the body is left-aligned. The footer row fits three items into 340px, so the manual-entry link wraps and the URL placeholder is cut off ("…view/... or"). Users without a link, which is common for referrals and recruiter outreach, get the hardest path to find.
- **Recommendation:** Left-align the dialog header at every breakpoint (`text-left`). On narrow screens stack the footer: Autofill at full width, then Cancel, then a full-width ghost button "Enter details manually". Shorten the placeholder to "Paste job URL".
- **Acceptance criteria:** At 375px, "Enter details manually" fits on one line with a tap target of at least 44px, and nothing in the link step is cut off.

### [A11Y-05] Opening Edit selects the whole Role Title, so the first keystroke replaces it
- **Severity:** 🔵 Low (*Errors × Edge*) · **Confidence:** Observed (`light-1440-edit.png`: the title is highlighted when the dialog opens) · **Effort:** ⚡ Quick Win · **Priority:** Later
- **Location:** [edit-application-sheet.tsx#L82](../../app/_components/edit-application-sheet.tsx#L82) (Radix `DialogContent` focuses and selects the first input by default)
- **Persona:** Sam opens Edit to add a note and starts typing straight away. "Full Stack Developer" becomes "Got a call back…".
- **Recommendation:** In edit mode, focus the dialog without selecting any text: `onOpenAutoFocus={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).querySelector<HTMLElement>("h2")?.focus(); }}`, and give the title `tabIndex={-1}`. Or focus the Status field instead, since that's the most common edit.
- **Acceptance criteria:** When the edit dialog opens, no field text is selected, and a screen reader announces the dialog title.

### [HIER-03] The edit dialog doesn't say which application you're editing
- **Severity:** 🔵 Low (*Hesitation × Common*) · **Confidence:** Observed · **Effort:** ⚡ Quick Win · **Priority:** Later
- **Location:** [edit-application-sheet.tsx#L84](../../app/_components/edit-application-sheet.tsx#L84)
- **Persona:** Maya has three "Full Stack Developer" rows. She opens Edit from the table and the header only says "Edit Job Application / Update role details, notes, and application status."
- **Recommendation:** Name the application being edited: use the title "Edit application" and the description "{company_name} · {role_name}", taken from the original row. That way the header stays correct while the user changes the fields.
- **Acceptance criteria:** The edit dialog header shows the company and role of the row it was opened from.

---

## Strengths to Protect

- **Link-first entry with honest fallbacks.** Failed extraction keeps the URL and drops you into the manual form. Pasting has a clipboard button and Enter support, and the detected platform is previewed before submit.
- **The edit Save button is disabled until something changes**, with a "No changes to save" title, which prevents empty no-op saves.
- **Errors keep the form open.** `onSubmit` rethrows, so a failed save never closes the dialog or loses input.
- **Progressive disclosure** hides optional fields on create but auto-expands when autofill or existing data fills them.
- **ComboboxInput** has a complete ARIA combobox pattern (`aria-activedescendant`, listbox, live region).
- **Uploaded resumes are cleaned up on discard.** No orphaned files when you discard through Cancel.

## To Verify (not counted)

| Item | Why unverified | How to check |
|---|---|---|
| Arrow keys inside the open status Select, or the calendar grid, in detail-sheet edit mode may also trigger next/prev navigation | Depends on whether Radix Select and react-day-picker stop event propagation | Interactive: open the Select in inline edit mode and press ArrowDown, then watch whether the app changes |

## Checked & Cleared

- **The edit form opens already marked as changed, but only with the mock database.** With `DATABASE_URL` unset, every edit dialog opens with "Save Changes" enabled, and Cancel shows "Discard Unsaved Changes?" even though nothing was changed. The cause is that mock rows have no `resumeId` key. The ResumePicker's `FormField` adds that key when it registers, so React Hook Form's `deepEqual` sees a different number of keys. Real rows come from `getTableColumns(jobApplications)` and include `resumeId`, so production isn't affected. To keep local and e2e runs reliable, add `resumeId: null` to the mock seed rows or set `resumeId: row.resumeId ?? null` in `defaultValues`.
- The calendar's year switcher works by clicking the month caption.

- DialogFooter `gap-2 sm:gap-0` doesn't collapse the buttons: the footer uses `sm:space-x-2`.
- Muted helper text at 11px: 4.93:1 light and 7.0:1 dark, both pass. Primary links (`#7047eb`) are 5.52:1 and pass. Emerald autofill banner text is 5.36:1 and passes.
- The `/applications/new` redirect works: `use-data-table.ts` reads `?create=true`.

## Method & Evidence

Source review of the create and edit paths, plus an interactive pass. The app ran locally against the mock store (`DATABASE_URL` unset). A read-only Playwright script opened the create dialog (link step, manual step, validation errors, more details, date picker) and the edit dialog at 1440, 768 and 375 px in light and dark mode. Nothing was submitted; client-side validation stopped the empty-form submit shown in the screenshots. React Hook Form state was read through the React fiber. Contrast was measured with `scripts/contrast.js` on token values resolved from `app/globals.css`. Ledger: 18 new IDs, 0 recurring or regressed, 0 suppressed.

## Files Reviewed

`app/(pages)/applications/new/page.tsx`, `app/(pages)/applications/data-table.tsx`, `app/(pages)/applications/hooks/use-data-table.ts`, `app/(pages)/applications/columns.tsx`, `app/(pages)/applications/components/application-detail-sheet.tsx`, `app/_components/new-application-button.tsx`, `app/_components/application-form.tsx`, `app/_components/application-form-fields.tsx`, `app/_components/link-autofill-bar.tsx`, `app/_components/edit-application-sheet.tsx`, `app/_components/resume-picker.tsx` (skim), `app/actions/applications.ts`, `app/api/extract/route.ts`, `lib/scraper.ts`, `lib/utils.ts`, `components/ui/{dialog,form,input,combobox-input}.tsx`, `app/globals.css`, `e2e/applications-dirty-guard.spec.ts`.
