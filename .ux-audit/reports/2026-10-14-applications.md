# UX Audit — Applications page

> **Verdict:** The Applications page is fast, consistent and careful with destructive actions, and the move to server-side pagination made it feel snappy even for a 1,400-row account. The biggest risk is to keyboard users: closing an application sends focus to the top of the page, so working through a list means re-tabbing from the logo every time. The most valuable next move is a small accessibility pass (focus return, the unnamed select, sub-4.5:1 badges), followed by making the mobile cards and the list itself fit large accounts.

| | |
| :--- | :--- |
| **Date** | 2026-10-14 |
| **Scope** | Applications page: table, mobile cards, Kanban, status pills, toolbar, pagination, bulk actions, detail panel; 20 files ([details](#files-reviewed)) |
| **Mode** | Interactive (mock mode, `http://localhost:3100`) + source |
| **Personas** | Maya (power user), Daniel (mobile), Noa (keyboard + screen reader), Lior (first visit) ([details](#personas)) |
| **Previous audit** | 2026-08-14 (applications, pre-ledger); add/edit flow 2026-10-12 |

---

## Scorecard

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| Visual design & craft | 4 | Clear hierarchy and consistent tokens; the Kanban board hides its biggest columns off-screen (`HIER-04`). |
| Content & clarity | 5 | Precise, specific copy (delete dialogs name the role and company); only small term inconsistencies (`COPY-02`). |
| Interaction & flow | 4 | URL-driven filters, sort and paging work well; pagination and mobile touch targets don't fit large accounts (`DATA-03`, `AFFORD-03`). |
| Feedback & trust | 5 | Confirmations for single and bulk deletes, undo on Kanban moves, dimmed rows while a new page loads. |
| Accessibility | 3 | Focus is lost after closing the detail panel (`A11Y-06`), plus several WCAG 4.1.2 / 1.4.3 / 2.5.8 failures. |
| Platform fit | 4 | Good responsive layouts (cards on mobile, FAB, swipeable Kanban tabs); first-run state is bare (`ONBD-01`). |

*1 Broken · 2 Poor · 3 Adequate · 4 Good · 5 Excellent · — Not evaluable in this mode.*

---

## What's Working

- **Every view is a URL.** Search, status, platform, sort, page and the open application all live in the query string ([`list-query.ts`](../../lib/applications/list-query.ts)), so Back works, links can be shared, and a refresh lands in the same place. Keep this when adding new filters.
- **Destructive actions are guarded and specific.** Single delete names the role and company ([`columns.tsx:390`](../../app/(pages)/applications/columns.tsx#L390)); bulk delete and bulk status changes each confirm with a count; Kanban moves offer Undo in the toast.
- **Loading never blanks the screen.** Filter, sort and page changes run in a transition: current rows stay visible and dim after 150 ms (`data-table-grid.tsx`), and the detail panel shows placeholders while the description loads.
- **Mobile is designed, not shrunk.** Table rows become cards, the Kanban becomes swipeable tabs with 44px tab targets, and Add moves to a thumb-reachable FAB.

---

## Top Priorities

1. **Let keyboard users work through applications without losing their place**: after closing an application, focus should return to the row they opened, not the top of the page. Resolves [`A11Y-06`](#a11y-06-closing-the-detail-panel-drops-keyboard-focus-to-the-page-body). Effort: Low.
2. **Make every badge and control readable and announced**: fix the sub-4.5:1 badges and counts and give the rows-per-page select a name. Resolves [`COLOR-04`](#color-04-small-badges-and-counts-fall-below-451-331447), [`A11Y-07`](#a11y-07-rows-per-page-select-has-no-accessible-name). Effort: Quick Win.
3. **Make the page fit an account with 1,400 applications**: bigger page sizes with first/last navigation, and a Kanban board that shows the Rejected and Ghosted columns, where most of those applications are. Resolves [`DATA-03`](#data-03-pagination-offers-only-previousnext-and-at-most-25-rows-for-large-accounts), [`HIER-04`](#hier-04-kanban-hides-rejected-and-ghosted-columns-off-screen-with-no-scroll-cue). Effort: Low.

---

## Themes

### Theme A: The mobile card is one big button
`DataTableMobileCard` makes the whole card `role="button"` and then puts a checkbox and a link inside it. Screen readers get a button that hides its controls, and the controls themselves are squeezed into tiny targets so that taps don't hit the card by accident.
- **Findings**: `A11Y-08`, `AFFORD-03`
- **Systemic fix**: Render the card as an `<article>` with a full-size "open" button (stretched-link pattern) behind the content, and give the checkbox and link their own 44px hit areas on top.

### Theme B: The list was designed around a small account
Pagination, page sizes and the Kanban layout all assume tens of rows. For a real 1,406-row account (960 ghosted, 383 rejected), the useful data sits behind 57+ pages of Previous/Next or off the right edge of the board.
- **Findings**: `DATA-03`, `HIER-04`
- **Systemic fix**: Design the list for "hundreds per status": larger page sizes with page jump, and a board that puts every status within reach.

### Theme C: Focus isn't managed per row
Each row is a focus stop *and* contains a button that does the same thing, and nothing remembers which row opened the panel.
- **Findings**: `A11Y-06`, `A11Y-09`
- **Systemic fix**: Make the role title button the row's single "open" control, and return focus to it (by application id) when the panel closes.

---

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `A11Y-06` Focus lost after closing panel | `A11Y-08` Mobile card nests controls in a button | `A11Y-09` Six tab stops per row |
| `A11Y-07` Rows-per-page select unnamed | `AFFORD-03` Mobile checkbox and link targets too small | `HIER-08` Column widths imbalanced |
| `COLOR-04` Badges and counts below 4.5:1 | `DATA-03` Pagination for large accounts | `DSYS-02` Row actions differ from Kanban |
| `COLOR-05` Checkboxes nearly invisible | `HIER-04` Kanban columns off-screen | `DSYS-03` Icon and chip noise |
| | `HIER-07` Status hides the stage | |
| | `HIER-06` Low density, no sticky header | |
| | `ONBD-01` Bare first-run state | |
| | `COPY-02` Inconsistent labels (polish) | |
| | `HIER-05` No h1 (polish) | |
| | `HIER-09` Uneven rows, header gap (polish) | |

**At a glance:** 🔴 0 Critical · 🟠 1 High · 🟡 10 Medium · 🔵 7 Low · ⚡ 6 Quick Wins · 0 to verify *(includes the table visual review addendum)*

---

## Findings

Ordered by priority (Now → Next → Later), then severity.

| ID | Finding | Severity | Confidence | Effort | Priority | Theme |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `A11Y-06` | Closing the detail panel drops keyboard focus to the page body | 🟠 High | Observed | Low | Now | C |
| `A11Y-07` | Rows-per-page select has no accessible name | 🟡 Medium | Observed | ⚡ Quick Win | Now | |
| `COLOR-04` | Small badges and counts fall below 4.5:1 | 🟡 Medium | Observed | ⚡ Quick Win | Now | |
| `A11Y-08` | Mobile card is a role=button containing a checkbox and a link | 🟡 Medium | Observed | Low | Next | A |
| `AFFORD-03` | Mobile checkbox (16px) and posting link (22px) fail 2.5.8 | 🟡 Medium | Observed | Low | Next | A |
| `DATA-03` | Pagination offers only Previous/Next and at most 25 rows | 🟡 Medium | Code-confirmed | Low | Next | B |
| `HIER-04` | Kanban hides Rejected and Ghosted columns off-screen | 🟡 Medium | Observed | Low | Next | B |
| `ONBD-01` | First-run page is an empty table with zero-count filters | 🟡 Medium | Code-confirmed | Medium | Next | |
| `COPY-02` | View labels, sign-in casing and bulk-delete plural are inconsistent | 🔵 Low | Observed | ⚡ Quick Win | Next | |
| `HIER-05` | Page has no h1 | 🔵 Low | Observed | ⚡ Quick Win | Next | |
| `A11Y-09` | Six tab stops per table row | 🔵 Low | Observed | Low | Later | C |

### `A11Y-06` Closing the detail panel drops keyboard focus to the page body

- **Severity**: 🟠 High (*Impedes × Core* for keyboard and screen-reader users)
- **Confidence**: Observed. Opened "Database Backend Engineer" with Enter on its title button, pressed Escape: `document.activeElement === document.body`, and the next Tab focused the "JobTracker" logo. On open, focus lands on "Next application" rather than the panel heading.
- **Effort**: Low · **Priority**: Now · **Theme**: C
- **Location**: [`application-detail-sheet.tsx:585`](../../app/(pages)/applications/components/application-detail-sheet.tsx#L585) (`<Sheet>` has no `onCloseAutoFocus`; the panel is opened from state, not a Radix `SheetTrigger`, so Radix has no trigger to return to)
- **Persona**: **Noa** reviews this week's applications one by one: open, read, Escape, next row. Every close throws her back to the sidebar, and she has to tab through the nav, banner, pills and toolbar (about 25 stops) to reach the row she was on.

**Problem.** WCAG 2.4.3 Focus Order: after a dialog closes, focus should return to the control that opened it. Losing position on the page's core loop makes the list practically unusable by keyboard.

**Recommendation.** Remember which application opened the panel and focus its title button on close; focus the panel's title on open.

```diff
  <SheetContent
    side="right"
+   onOpenAutoFocus={(e) => {
+     e.preventDefault();
+     titleRef.current?.focus();
+   }}
+   onCloseAutoFocus={(e) => {
+     e.preventDefault();
+     document
+       .querySelector<HTMLElement>(
+         `[data-application-id="${currentApp?.id}"] [data-testid="view-details-button"]`,
+       )
+       ?.focus();
+   }}
```
Add `data-application-id={row.original.id}` to the table row and mobile card, and `ref={titleRef} tabIndex={-1}` to the `SheetTitle`. Because J/K can change the current application, return focus to the *current* one, which is also the row the user expects to land on.

**Acceptance criteria**
- [ ] Open any row with Enter, press Escape: focus is on that row's title button.
- [ ] Open a row, press J twice, press Escape: focus is on the third row's title.
- [ ] On open, a screen reader announces the panel title first.

### `A11Y-07` Rows-per-page select has no accessible name

- **Severity**: 🟡 Medium (*Slows × Edge*, WCAG Level A failure)
- **Confidence**: Observed. axe `button-name` (critical) at 375, 768 and 1440px, light and dark: `role="combobox"` with no name. Comboboxes don't take their name from their content, so the visible "Rows per page:" text and the "10" value don't count.
- **Effort**: ⚡ Quick Win · **Priority**: Now
- **Location**: [`data-table-grid.tsx:283`](../../app/(pages)/applications/components/data-table-grid.tsx#L283)
- **Persona**: **Noa** hears "10, combobox, collapsed" with no clue what it controls.

**Problem.** WCAG 4.1.2 Name, Role, Value.

**Recommendation.**
```diff
- <SelectTrigger className="h-8 w-[64px] ...">
+ <SelectTrigger aria-label="Rows per page" className="h-8 w-[64px] ...">
```

**Acceptance criteria**
- [ ] axe reports no `button-name` violation on /applications.
- [ ] A screen reader announces "Rows per page, 10, combobox".

### `COLOR-04` Small badges and counts fall below 4.5:1 (3.31–4.47:1)

- **Severity**: 🟡 Medium (*Slows × Core* for low-vision users)
- **Confidence**: Observed (axe `color-contrast`, measured in the browser):

  | Element | Size | Ratio |
  | :--- | :--- | :--- |
  | "Applied" status badge, `text-primary` on `bg-primary/15` (table, cards) | 11px | 4.45:1 |
  | Active status pill count, white on `primary-foreground/20` over primary (light) | 12px | 3.80:1 |
  | Same, dark theme | 12px | 4.17:1 |
  | Kanban salary chip, `text-emerald-600` on `bg-emerald-500/10` | 10px | 3.31:1 |
  | Inactive "Kanban" / "Table" view label, `text-muted-foreground` on `bg-muted/60` | 12px | 4.47:1 |
- **Effort**: ⚡ Quick Win · **Priority**: Now
- **Location**: [`columns.tsx:59`](../../app/(pages)/applications/columns.tsx#L59) (`statusBadgeClasses.applied`, duplicated in the mobile card and the detail sheet), [`status-filter-pills.tsx:65`](../../app/(pages)/applications/components/status-filter-pills.tsx#L65), [`kanban-card.tsx:214`](../../app/(pages)/applications/components/kanban-card.tsx#L214)
- **Persona**: **Maya**, scanning statuses on a bright laptop screen, misreads the purple "Applied" badges and the green salary chips; at 10–11px there's no size to compensate.

**Problem.** WCAG 1.4.3 Contrast (Minimum) requires 4.5:1 for text this small. Most of these miss by a hair, so the fix is a token step, not a redesign.

**Recommendation.** Darken the text one step and drop the alpha tint on the active count:
```diff
- applied: "bg-primary/15 text-primary border-primary/25 ...",
+ applied: "bg-primary/10 text-primary-strong border-primary/25 ...",   // add --primary-strong ≈ 255 70% 45%
- "bg-primary-foreground/20 text-primary-foreground"
+ "bg-primary-foreground text-primary"
- "text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
+ "text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
```
Move `statusBadgeClasses` into one shared module so the table, cards and detail sheet can't drift.

**Acceptance criteria**
- [ ] axe reports no `color-contrast` violations on /applications (table and Kanban), light and dark.

### `A11Y-08` Mobile card is a role=button that contains a checkbox and a link

- **Severity**: 🟡 Medium (*Impedes × Edge*)
- **Confidence**: Observed. axe `nested-interactive` on all 10 cards at 375 and 768px.
- **Effort**: Low · **Priority**: Next · **Theme**: A
- **Location**: [`data-table-mobile-card.tsx:67`](../../app/(pages)/applications/components/data-table-mobile-card.tsx#L67)
- **Persona**: **Noa** on a phone with TalkBack: the card is announced as one button labelled "Application for … at …". The checkbox and "Open job posting" link inside it are announced inconsistently or skipped, so she can't select cards for bulk actions.

**Problem.** WCAG 4.1.2: interactive content inside `role="button"` has no reliable semantics.

**Recommendation.** Design spec:
1. Make the card an `<article aria-labelledby={titleId}>` (no role, no tabIndex).
2. Make the role title a `<button>` that opens the panel, with an `::after` overlay (`absolute inset-0`) so the whole card stays tappable.
3. Raise the checkbox and link above the overlay (`relative z-10`).

**Acceptance criteria**
- [ ] axe reports no `nested-interactive` on /applications at 375px.
- [ ] With a screen reader: swiping through a card reaches the title button, the checkbox and the link as separate controls.
- [ ] Tapping anywhere on the card except the checkbox or link still opens the panel.

### `AFFORD-03` Mobile checkbox (16px) and posting link (22px) fail 2.5.8; area around checkbox is a dead zone

- **Severity**: 🟡 Medium (*Impedes × Common* on mobile)
- **Confidence**: Observed. `inspect_page.js` at 375px: "Select application" 16×16 and "Open original job posting" 22×22 fail 2.5.8 on all 10 cards; Kanban "Job Link" icons are 14×14. The checkbox's wrapper (`p-1 -m-1`) only stops propagation, so a tap just beside the checkbox does nothing at all.
- **Effort**: Low · **Priority**: Next · **Theme**: A
- **Location**: [`data-table-mobile-card.tsx:96`](../../app/(pages)/applications/components/data-table-mobile-card.tsx#L96), [`:161`](../../app/(pages)/applications/components/data-table-mobile-card.tsx#L161)
- **Persona**: **Daniel**, selecting five rejected applications on his phone to bulk-update them, misses the checkbox, gets no response, and taps again; sometimes the panel opens instead.

**Problem.** WCAG 2.5.8 Target Size (Minimum) is 24×24px; Apple and Material guidance is 44/48px for touch.

**Recommendation.** Turn the wrapper into the checkbox's label so the padded area toggles it, and enlarge the link's hit area:
```diff
- <div className="flex items-center justify-center p-1 -m-1" onClick={(e) => e.stopPropagation()} ...>
-   <Checkbox ... aria-label="Select application" />
- </div>
+ <label className="flex items-center justify-center h-11 w-11 -m-3 cursor-pointer" onClick={(e) => e.stopPropagation()}>
+   <Checkbox ... aria-label={`Select ${item.role_name} at ${item.company_name}`} />
+ </label>
- className="p-1 -mr-1 ..."
+ className="h-11 w-11 -m-3 ..."
```

**Acceptance criteria**
- [ ] At 375px, `inspect_page.js` reports 0 targets failing 2.5.8.
- [ ] Tapping within 12px of the checkbox toggles it.

### `DATA-03` Pagination offers only Previous/Next and at most 25 rows for large accounts

- **Severity**: 🟡 Medium (*Impedes × Common* for long-time users)
- **Confidence**: Code-confirmed. `TABLE_ROWS = [5, 10, 15, 20, 25]` and the footer only has Previous/Next. In production, the largest account has 1,406 applications: 141 pages at the default size, 57 at the maximum.
- **Effort**: Low · **Priority**: Next · **Theme**: B
- **Location**: [`data-table-grid.tsx:25`](../../app/(pages)/applications/components/data-table-grid.tsx#L25) (and `PAGE_SIZES` in [`list-query.ts`](../../lib/applications/list-query.ts))
- **Persona**: **Maya** wants to skim everything she applied to in March. Sorting by date puts it around page 40; she clicks Next 40 times or gives up.

**Problem.** Pagination should let users reach the end of a list and choose a density that suits scanning. Server paging made large pages cheap, so the limit is no longer technical.

**Recommendation.** Design spec:
1. Page sizes: 10, 25, 50, 100. Keep the default at 10; remember the choice in the URL (already the case).
2. Footer: `« First  ‹ Prev  Page [ 3 ] of 57  Next ›  Last »`, with the page number editable (Enter to jump).
3. Change "Showing 10 of 1406 application(s)" to "1–10 of 1,406".

**Acceptance criteria**
- [ ] A user can reach the last page in one click and any page by typing its number.
- [ ] 100 rows per page is available, and the count reads "1–100 of 1,406".

### `HIER-04` Kanban hides Rejected and Ghosted columns off-screen with no scroll cue

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed (1440px screenshot `kanban/1440w-fold.png`). Six fixed 280px columns overflow the content area; "Offer / Accepted" is cut at the edge, and Rejected and Ghosted aren't visible. The scrollbar is thin and sits at the bottom of a board taller than the screen.
- **Effort**: Low · **Priority**: Next · **Theme**: B
- **Location**: [`applications-kanban.tsx:413`](../../app/(pages)/applications/components/applications-kanban.tsx#L413), column width at [`:273`](../../app/(pages)/applications/components/applications-kanban.tsx#L273)
- **Persona**: **Maya**: 1,343 of her 1,406 applications are Rejected or Ghosted. She opens the board and sees four nearly-empty columns, with nothing suggesting the rest exist.

**Problem.** Content that's off-screen without an affordance effectively doesn't exist (visibility of system status). It also undercuts the counts shown in the column headers.

**Recommendation.** Design spec:
1. At `xl`, let columns share the width (`flex-1 min-w-[220px]`) so all six fit at 1440px.
2. Below that, add a fading edge plus ‹ › scroll buttons on the board, and keep the scrollbar visible.
3. Optional: a "Hide empty columns" toggle, persisted in the URL.

**Acceptance criteria**
- [ ] At 1440px, all six column headers are visible without scrolling.
- [ ] At 1024px, a visible control scrolls the board horizontally.

### `ONBD-01` First-run page is an empty table with zero-count filters

- **Severity**: 🟡 Medium (*Slows × Core* for every new user)
- **Confidence**: Code-confirmed. With no data, the page renders seven "0" pills, a search box, a filter toolbar, and a table whose empty row says "No applications found" under a filter icon.
- **Effort**: Medium · **Priority**: Next
- **Location**: [`data-table-grid.tsx:175`](../../app/(pages)/applications/components/data-table-grid.tsx#L175)
- **Persona**: **Lior** arrives from a link, isn't signed in, and sees an empty spreadsheet with filters for nothing. The value (autofill from a job link, Kanban, analytics) isn't visible, and the filter icon suggests something went wrong.

**Problem.** First-use experience: an empty state should explain the product's value and offer the first action. A filter icon reads as "no results", not "start here".

**Recommendation.** Design spec: when the account has zero applications and no filters are active, hide the pills and toolbar and show a centred panel:
- Title: "Track your first application"
- Body: "Paste a job link and we'll fill in the role, company and location for you."
- Actions: **Paste a job link** (opens Add on the link step) · *Enter details manually*
- Secondary: a three-item strip (Track · See your pipeline · Spot what's working) linking to Kanban and Analytics.

**Acceptance criteria**
- [ ] A new account sees the onboarding panel instead of the table.
- [ ] The primary action opens the Add dialog on the link step.

### `COPY-02` View labels, sign-in casing and bulk-delete plural are inconsistent

- **Severity**: 🔵 Low (*Slows × Edge*)
- **Confidence**: Observed (768px screenshot shows "Cards" next to "Kanban"; 375px shows "Cards / Board"; 1440px shows "Table / Kanban").
- **Effort**: ⚡ Quick Win · **Priority**: Next (polish batch)
- **Location**: [`data-table-toolbar.tsx:167`](../../app/(pages)/applications/components/data-table-toolbar.tsx#L167), [`:183`](../../app/(pages)/applications/components/data-table-toolbar.tsx#L183); [`data-table-bulk-actions.tsx:125`](../../app/(pages)/applications/components/data-table-bulk-actions.tsx#L125)

| Where | Current | Proposed |
| :--- | :--- | :--- |
| View switch (all widths) | "Cards"/"Table" · "Board"/"Kanban", switching at different breakpoints (`lg` vs `sm`) | "List" · "Board" everywhere |
| Header vs guest banner | "Sign In" · "Sign in" | "Sign in" in both |
| Bulk delete, 1 selected | "Delete 1 Applications?" / "Delete 1 Applications" | "Delete 1 application?" (pluralize with the count) |
| Footer | "Showing 10 of 18 application(s)" | "1–10 of 18" |

**Acceptance criteria**
- [ ] The view switch shows the same two words at 375, 768 and 1440px.
- [ ] Selecting one row and choosing Delete shows "Delete 1 application?".

### `HIER-05` Page has no h1

- **Severity**: 🔵 Low (*Slows × Edge*)
- **Confidence**: Observed. axe `page-has-heading-one` at every width; "Job Applications" is a `<span>` in the top bar.
- **Effort**: ⚡ Quick Win · **Priority**: Next (polish batch)
- **Location**: [`nav.tsx:74`](../../app/_components/nav.tsx#L74)
- **Persona**: **Noa** jumps by headings (H) to orient herself and finds none at the top level.

**Recommendation.** Render the top-bar page title as `<h1 className="text-sm font-semibold">` (visual unchanged), and keep sub-headings in the page at h2+.

**Acceptance criteria**
- [ ] axe reports no `page-has-heading-one` on /applications.

### `A11Y-09` Six tab stops per table row

- **Severity**: 🔵 Low (*Slows × Edge*)
- **Confidence**: Observed. Each row is a focus stop (`tabIndex={0}`) and also contains checkbox, title button, posting link, edit and delete. The row and the title button both open the panel. With 10 rows that's 60 stops before the pagination.
- **Effort**: Low · **Priority**: Later · **Theme**: C
- **Location**: [`data-table-grid.tsx:114`](../../app/(pages)/applications/components/data-table-grid.tsx#L114), [`columns.tsx:175`](../../app/(pages)/applications/columns.tsx#L175)
- **Persona**: **Noa** tabs through each row twice for the same action.

**Recommendation.** Remove `tabIndex={0}` and the key handler from the row (mouse click stays); the title button is the keyboard entry point. Optionally add J/K row navigation on the table, matching the panel.

**Acceptance criteria**
- [ ] Each row has 5 tab stops, and Enter on the title still opens the panel.

---

## Table Visual Review (addendum)

A closer look at the desktop table's layout and visual design (1440px, light and dark). The table is clean and calm, but it is styled for browsing a handful of rows, not for scanning hundreds.

| ID | Finding | Severity | Confidence | Effort | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `COLOR-05` | Unchecked checkboxes are nearly invisible | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Now |
| `HIER-07` | Status column shows sub-stage text, hiding the stage | 🟡 Medium | Observed | Low | Next |
| `HIER-06` | Four stacked bands and tall rows show ~9 applications per screen | 🟡 Medium | Observed | Medium | Next |
| `HIER-09` | Uneven row heights; header band stops short | 🔵 Low | Observed | ⚡ Quick Win | Next |
| `HIER-08` | Role column has slack while other columns truncate | 🔵 Low | Observed | Low | Later |
| `DSYS-02` | Table and Kanban use different row-action patterns | 🔵 Low | Observed | Low | Later |
| `DSYS-03` | Repeated icons, sort arrows and chips compete with the data | 🔵 Low | Observed | Low | Later |

### `COLOR-05` Unchecked checkboxes are nearly invisible (1.2:1 light, 1.08:1 dark)

- **Severity**: 🟡 Medium (*Slows × Common*, WCAG 1.4.11 failure)
- **Confidence**: Code-confirmed + visible in `table/1440w.png`. Unchecked state uses `border-border/70` on `bg-background`: about `hsl(220 14% 92%)` on white = **1.20:1**; dark `hsl(224 16% 13%)` on the card = **1.08:1** (`contrast.js`). Non-text UI needs 3:1.
- **Effort**: ⚡ Quick Win · **Priority**: Now
- **Location**: [`components/ui/checkbox.tsx:36`](../../components/ui/checkbox.tsx#L36) (shared; affects table, cards, select-all)
- **Persona**: **Maya** doesn't realise rows are selectable; bulk status changes, her fastest way to clear 900 ghosted rows, go unnoticed.

**Recommendation.**
```diff
- : "bg-background hover:bg-accent/40 border-border/70",
+ : "bg-background hover:bg-accent/40 border-input",
```
(`--input` is `220 9% 58%` light / `220 10% 44%` dark, already tuned for 3:1 on form fields.)

**Acceptance criteria**
- [ ] Unchecked checkbox border measures ≥ 3:1 against its background in both themes.

### `HIER-07` Status column shows sub-stage text, hiding the stage

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Observed. In the first 10 rows, the amber badge reads "Recruiter Screen", "Initial Screen", "Technical Screen" and "System Design Int…" (truncated); the blue one reads "Under Review" and "Resume Review". The stage ("Interviewing", "In Review") appears only in a screen-reader prefix.
- **Effort**: Low · **Priority**: Next
- **Location**: [`columns.tsx:282`](../../app/(pages)/applications/columns.tsx#L282)
- **Persona**: **Maya** sorts by status to find everything at interview stage and has to read four different labels and decode colours, while the pills above the table use stage names.

**Problem.** The badge mixes two levels of information: the pipeline stage, which is what people scan for and filter by, and the free-text detail. One colour standing for many labels forces reading instead of scanning, and truncation cuts the detail anyway.

**Recommendation.** Design spec: the badge always shows the stage label, in the pills' vocabulary ("Applied", "In Review", "Interviewing", "Offer", "Rejected", "Ghosted"). Custom text goes on a second line in muted 12px text, when it differs from the stage.

```
Status
[Interviewing]
Technical screen
```

**Acceptance criteria**
- [ ] Every badge text matches one of the status pill labels.
- [ ] Custom stage text is visible in full (wraps, no truncation) below the badge.

### `HIER-06` Four stacked bands and tall rows show about 9 applications per screen

- **Severity**: 🟡 Medium (*Slows × Core* for large accounts)
- **Confidence**: Observed (`table/1440w-fold.png`, 1440×900). Top bar, guest banner, status pills and a separate toolbar card take the first ~330px (37% of the screen); each row is ~63px (two-line role/company cell plus `py-3`). Result: 9 visible rows. Signed in (no banner), about 11. The header scrolls away with the rows.
- **Effort**: Medium · **Priority**: Next
- **Location**: [`data-table-grid.tsx:58`](../../app/(pages)/applications/components/data-table-grid.tsx#L58) (table and row padding), [`data-table.tsx`](../../app/(pages)/applications/data-table.tsx) (pills and toolbar as separate bands)
- **Persona**: **Maya** reviews 50 applications a week; at 9 per screen she scrolls and pages constantly, and loses the column headers when she scrolls.

**Recommendation.** Design spec:
1. Merge the pills into the toolbar card as its first row (one container instead of two), or render them as tabs on top of the table.
2. Make the table header sticky (`sticky top-0`) inside the page scroll.
3. Add a density toggle (Comfortable / Compact) in the footer. Compact: single-line cell "**Role** · Company", `py-2` (≈40px rows), so ~16 rows fit at 1440×900.

```
┌ All 18 · Applied 5 · In Review 2 · Interviewing 6 · …            ┐
│ [Search……………………]  [Platform ▾]  [List|Board]  [+ Add]         │
├──────────────────────────────────────────────────────────────────┤
│ ☐ Role · Company                   Applied  Stage       Location │ ← sticky
│ ☐ Full Stack Developer · PostHog   Oct 12   Applied     Remote   │ ← 40px
```

**Acceptance criteria**
- [ ] At 1440×900 signed in, compact mode shows at least 15 rows above the fold.
- [ ] Column headers stay visible while scrolling the table.

### `HIER-09` Uneven row heights; header band stops short of the actions column

- **Severity**: 🔵 Low (*Slows × Edge*, polish)
- **Confidence**: Observed. Row pitch is 88px for rows without a resume and 90–93px for rows with one (Figma, Vercel, OpenAI): the resume button is `h-5 w-5` (20px) inside a 16px text line. The header's `bg-muted/30` band ends before the actions column, whose sticky header uses `bg-card/95`, leaving a white block at the top right.
- **Effort**: ⚡ Quick Win · **Priority**: Next (polish batch)
- **Location**: [`columns.tsx:229`](../../app/(pages)/applications/columns.tsx#L229), [`data-table-grid.tsx:92`](../../app/(pages)/applications/components/data-table-grid.tsx#L92)

**Recommendation.** Use `h-4 w-4` for the resume button (matching the external-link icon), and give the actions `TableHead` an opaque version of the header colour so the band runs edge to edge.

**Acceptance criteria**
- [ ] All rows have the same height regardless of resume attachment.
- [ ] The header band spans the full table width, including the actions column.

### `HIER-08` Role column has slack while Status, Location and Platform truncate

- **Severity**: 🔵 Low (*Slows × Common*)
- **Confidence**: Observed. "System Design Int…", "San Francisco, CA (I…" and "Company W…" truncate at fixed `max-w` (115–130px), while the role column (`min-w-[160px]`, no max) ends most titles 80–200px before the next column.
- **Effort**: Low · **Priority**: Later
- **Location**: [`columns.tsx:305`](../../app/(pages)/applications/columns.tsx#L305); widths in [`data-table-grid.tsx`](../../app/(pages)/applications/components/data-table-grid.tsx)

**Recommendation.** Use `table-fixed` with explicit column percentages (Role 30%, Date 11%, Stage 15%, Location 16%, Platform 12%, Salary 12%, actions 4%) and drop the per-cell `max-w`, so space goes where text actually is. Keep a `title` tooltip for values that still truncate.

**Acceptance criteria**
- [ ] At 1440px, none of the seed data truncates in Status, Location or Platform.

### `DSYS-02` Table and Kanban use different row-action patterns

- **Severity**: 🔵 Low (*Slows × Common*)
- **Confidence**: Observed. Every table row shows a pencil and a trash icon (20 icons on one page, delete one click away); Kanban cards put the same actions in a ⋯ menu ([`kanban-card.tsx:158`](../../app/(pages)/applications/components/kanban-card.tsx#L158)).
- **Effort**: Low · **Priority**: Later
- **Location**: [`columns.tsx:337`](../../app/(pages)/applications/columns.tsx#L337)

**Recommendation.** Use the ⋯ menu (Edit, Move to…, Delete) in both views. In the table, show it subdued at rest and fully on row hover or focus. The detail panel remains the primary place to edit.

**Acceptance criteria**
- [ ] Table rows and Kanban cards offer the same actions through the same control.

### `DSYS-03` Repeated icons, always-on sort arrows and platform chips compete with the data

- **Severity**: 🔵 Low (*Slows × Common*)
- **Confidence**: Observed. The first column alone carries three icon types (external link, building, resume) repeated on every row; all six headers show a sort arrow in bold uppercase, at the same weight as the data; platform is styled as a grey chip, giving low-priority metadata the same visual weight as the status badge. In dark mode the table card (10% lightness) on the 7% page with 15% borders almost loses its edge.
- **Effort**: Low · **Priority**: Later
- **Location**: [`columns.tsx:201`](../../app/(pages)/applications/columns.tsx#L201) (building icon), header renderer [`columns.tsx:88`](../../app/(pages)/applications/columns.tsx#L88), platform chip [`columns.tsx:306`](../../app/(pages)/applications/columns.tsx#L306)

**Recommendation.**
- Drop the building icon (company is already the second line); show the external-link icon on row hover only.
- Headers: sentence case, `text-muted-foreground font-medium`; show the sort arrow only on the active column and on hover.
- Platform: plain muted text, like Location; keep colour for status only.
- Dark mode: raise `--border` to about 20% lightness so the table has a visible frame.

**Acceptance criteria**
- [ ] Status is the only coloured element in a row.
- [ ] At rest, only the active sort column shows an arrow.

**Updated totals (whole report):** 🔴 0 Critical · 🟠 1 High · 🟡 10 Medium · 🔵 7 Low · ⚡ 6 Quick Wins · 0 to verify. Visual design & craft stays at **4** (three Medium findings); Accessibility stays at **3**.

---

## Coverage

| Category | Status | Findings |
| :--- | :--- | :--- |
| `HIER` Visual hierarchy | Evaluated | `HIER-04`–`HIER-09` |
| `TYPO` Typography | Evaluated (39 uses of 10–11px text; covered under contrast) | — |
| `COLOR` Color & contrast | Evaluated (axe, light + dark; `contrast.js` for checkbox borders) | `COLOR-04`, `COLOR-05` |
| `DSYS` Design system | Evaluated (`statusBadgeClasses` duplicated in 3 files; noted in `COLOR-04`) | `DSYS-02`, `DSYS-03` |
| `MOTION` Motion | Evaluated (short transitions; Kanban scale on drop) | — |
| `COPY` Content | Evaluated | `COPY-02` |
| `STATE` States | Evaluated: loading skeleton, pending dim, no-results, error boundary, detail loading/error | — |
| `I18N` Content resilience | Evaluated (Hebrew role titles sort and render; long titles truncate with ellipsis) | — |
| `NAV` Navigation | Evaluated | — |
| `AFFORD` Affordance & targets | Evaluated (measured at 375px) | `AFFORD-03` |
| `FORM` Forms | Partial: add/edit form audited 2026-10-12, not repeated | — |
| `FLOW` Task flow | Evaluated | — |
| `COGN` Cognitive load | Evaluated | — |
| `SRCH` Search & filtering | Evaluated (server search incl. descriptions, debounced; filters reset page) | — |
| `DATA` Data display | Evaluated | `DATA-03` |
| `TRUST` Feedback & confirmation | Evaluated | — |
| `A11Y` Accessibility | Evaluated (axe, keyboard walk, focus checks); no screen-reader software run | `A11Y-06`–`A11Y-09` |
| `PERF` Perceived performance | Evaluated | — |
| `ETHIC` Dark patterns | Evaluated (guest banner is dismissible, no pressure tactics) | — |
| `PLAT` Platform conventions | Evaluated (no horizontal overflow at 375px; FAB clears the safe area) | — |
| `ONBD` First use | Evaluated from source (mock data has no empty account) | `ONBD-01` |
| `PERS` Persistence | Evaluated (all view state in URL) | — |

---

## Appendix

### Personas
- **Maya, power user**: Front-end developer, 18 months into a job search, 1,400+ applications, mostly rejected or ghosted. Desktop at 1440px, reviews weekly, relies on search, sort and the Kanban board. Comfortable with keyboard shortcuts.
- **Daniel, on the go**: Updates statuses on his phone between interviews, one-handed, often outdoors in glare. Uses cards and bulk status changes.
- **Noa, keyboard and screen reader**: Low vision with a repetitive strain injury; navigates with the keyboard and NVDA/TalkBack. Works through applications in sequence.
- **Lior, first visit**: New graduate who arrived from a shared link, not signed in, zero applications, judging in under a minute whether this beats a spreadsheet.

### Walkthrough

| Step | Persona | Question that failed | Finding |
| :--- | :--- | :--- | :--- |
| Land on page | Lior | Will they know what to do? (empty table with filters) | `ONBD-01` |
| Review an application, close it | Noa | Will they see progress? (focus resets to top) | `A11Y-06` |
| Change page size / find March applications | Maya | Can they do it efficiently? (Prev/Next only, max 25) | `DATA-03` |
| Open Kanban | Maya | Will they notice the right control? (main columns off-screen) | `HIER-04` |
| Select cards for a bulk update | Daniel, Noa | Will they hit / find the control? | `AFFORD-03`, `A11Y-08` |

### Files Reviewed
- [`app/(pages)/applications/page.tsx`](../../app/(pages)/applications/page.tsx), [`data-table.tsx`](../../app/(pages)/applications/data-table.tsx), [`columns.tsx`](../../app/(pages)/applications/columns.tsx), [`loading.tsx`](../../app/(pages)/applications/loading.tsx), [`error.tsx`](../../app/(pages)/applications/error.tsx), [`hooks/use-data-table.ts`](../../app/(pages)/applications/hooks/use-data-table.ts)
- Components: [`data-table-grid.tsx`](../../app/(pages)/applications/components/data-table-grid.tsx), [`data-table-toolbar.tsx`](../../app/(pages)/applications/components/data-table-toolbar.tsx), [`data-table-mobile-card.tsx`](../../app/(pages)/applications/components/data-table-mobile-card.tsx), [`data-table-bulk-actions.tsx`](../../app/(pages)/applications/components/data-table-bulk-actions.tsx), [`status-filter-pills.tsx`](../../app/(pages)/applications/components/status-filter-pills.tsx), [`applications-kanban.tsx`](../../app/(pages)/applications/components/applications-kanban.tsx), [`kanban-card.tsx`](../../app/(pages)/applications/components/kanban-card.tsx), [`application-detail-sheet.tsx`](../../app/(pages)/applications/components/application-detail-sheet.tsx), [`application-detail-view.tsx`](../../app/(pages)/applications/components/application-detail-view.tsx), [`application-timeline.tsx`](../../app/(pages)/applications/components/application-timeline.tsx)
- Shared: [`lib/applications/list-query.ts`](../../lib/applications/list-query.ts), [`app/_components/nav.tsx`](../../app/_components/nav.tsx), [`app/_components/guest-notice.tsx`](../../app/_components/guest-notice.tsx), [`components/ui/button-variants.ts`](../../components/ui/button-variants.ts), [`components/ui/select.tsx`](../../components/ui/select.tsx), [`app/globals.css`](../../app/globals.css)

### Method & Evidence
- **Passes**: Task walkthrough · State inventory · Heuristic sweep (22 categories) · Accessibility (WCAG 2.2 AA) · Visual craft review · Content review.
- **Token inventory** (`app/(pages)/applications`, 20 files): 0 color literals, 408 semantic vs 96 raw palette classes (amber, blue, emerald, rose, slate for status), 8 font sizes, 7 radii, 7 shadows, 100 arbitrary values (mostly `text-[10px]`/`text-[11px]` and fixed widths), one icon library (lucide).
- **Contrast**: measured in the browser by axe-core on resolved colors (table above in `COLOR-04`).
- **Rendered checks**: `inspect_page.js` on `http://localhost:3100/applications?view=table` at 375/768/1440 (light), 375/1440 (dark); `?view=kanban` at 375/1440; keyboard walk of 60 stops at 1440 with focus crops. Manual checks in the built-in browser: detail panel open/close focus, J/K, focus rings via real Tab presses. Screenshots: `.ux-audit/screenshots/2026-10-14-applications/`.
- **Checked & cleared**:
  - *Missing focus ring on "Add Application", "Platform", "Sign In", "Toggle theme"*: false positive. The ring is drawn with `box-shadow` under `transition-all`; with the transition disabled the computed style shows the 2px offset + 4px ring. The script captured before the transition ran.
  - *Search input has no label*: accessible name comes from the placeholder ("Search applications..."); axe passes. Worth a visible or `aria-label` later, not a failure.
  - *Status shown by color only in the table*: each badge has an sr-only category prefix ("Interview: Recruiter Screen"), and the visible text names the stage.
  - *Next.js "N" dev indicator overlapping the sidebar and the obscured "Privacy" focus stop*: development-only overlay.
  - *Delete without confirmation*: single and bulk deletes both confirm.
- **Suppressed**: 0.
- **Not run**: screen-reader software (NVDA/VoiceOver); 200% zoom; an empty account (mock store always has seed data).
