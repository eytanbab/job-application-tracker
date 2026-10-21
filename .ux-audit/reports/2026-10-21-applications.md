# UX/UI Audit: Applications (tracker)

**Date:** 2026-10-21 · **Flow:** `applications` (table, board, detail sheet, add/edit, bulk actions) · **Mode:** Interactive (demo server, Playwright + axe) plus source review · **Previous audit:** [2026-10-14](./2026-10-14-applications.md) (all 41 findings resolved since)

## Verdict

The tracker looks finished: the table, board and detail sheet render cleanly at every width, keyboard focus is visible, and axe finds a single contrast problem. The serious problems are underneath. Three server actions trust input they should not (one can read another user's resume, one can write into another user's history, and job-link autofill can be pointed at internal addresses), and the detail sheet can save, lose or misapply edits in ordinary use. Fix those first; the speed and feature work after that is about handling 100+ applications without friction.

## Scorecard

| Dimension | Score (1-5) | Basis |
| :--- | :---: | :--- |
| Visual | 4 | Clean hierarchy and spacing; board card titles are squeezed (`HIER-10`); one contrast miss (`COLOR-04`). |
| Content | 4 | Plain labels; "Board" in the UI is `view=kanban` in the URL, and "Offer / Accepted" vs "Offers" vs "Offer" across views. |
| Flow | 3 | Selection and J/K stop at the page boundary (`FLOW-03`); three edit models (`COGN-02`); follow-ups live only on analytics. |
| Trust | 2 | Edits saved by accident, lost on refresh, or applied to the wrong application (`TRUST-10/11/12`); ghost dates out of order (`TRUST-08`); security gaps (`SEC-01/02/03`). |
| Accessibility | 4 | 0 axe violations in dark mode, 1 in light; visible focus on all stops; named controls. |
| Performance | 3 | Bulk actions are N sequential requests (`PERF-03`); no optimistic moves (`PERF-04`); 16 queries for the board (`PERF-05`). |

## What's Working

- **Rendering and layout:** no horizontal overflow at 320, 375, 768 or 1440px in light or dark; 47 interactive elements, none failing WCAG 2.5.8.
- **Focus:** every keyboard stop shows a ring (the inspector's 4 "no focus change" stops are an animated box-shadow ring, confirmed with focus screenshots).
- **Server-side list:** pagination, sorting and filtering run on the server with a stable tie-breaker; out-of-range pages are clamped; LIKE wildcards are escaped; reads are user-scoped.
- **URL state:** filters, sort, page, view and the open application are all in the URL and survive reload; search is debounced to one request per pause.
- **Destructive actions:** delete and bulk delete confirm first, and bulk partial failures are reported.

## Top Priorities

1. **Close the three security gaps** (`SEC-01`, `SEC-02`, `SEC-03`): each is a small server-side check.
2. **Make the detail sheet trustworthy** (`TRUST-10`, `TRUST-11`, `TRUST-12`, `TRUST-08`): a status change saves only the status, responses for the wrong application are ignored, refreshes never wipe a draft, and ghost dates come after the last activity.
3. **Make status changes instant and bulk actions one request** (`PERF-03`, `PERF-04`): cards move on drop, and a 25-row bulk edit is one round trip.

## Themes

| Theme | Findings | Systemic fix |
| :--- | :--- | :--- |
| **A. Server actions trust the caller** | `SEC-02`, `SEC-03`, `FORM-04` | Validate every action's input with the existing zod schema and scope every write (including history and file keys) to the caller. |
| **B. Detail-sheet state is keyed on objects, not ids** | `TRUST-10`, `TRUST-11`, `TRUST-12`, `PERF-07` | One reducer for `currentApp`/`draft`, keyed on the application id; responses carry the id they belong to. |
| **C. One request per item** | `PERF-03`, `PERF-05`, `PERF-09` | Batch actions (`inArray`) and batch reads (`db.batch`, window functions). |
| **D. Ghost timing has two definitions** | `TRUST-08`, `TRUST-13` | Use `ghostsAt` from `lib/analytics/definitions.ts` in both sync paths, and re-check the category in the update. |

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `SEC-01`, `SEC-02`, `SEC-03`, `TRUST-09`, `TRUST-10`, `TRUST-11`, `TRUST-12`, `COLOR-04`, `SRCH-02` | `PERF-03`, `PERF-04`, `TRUST-08`, `TRUST-13`, `HIER-10`, `FLOW-03`, `PERF-06`, `FORM-04`, `FLOW-04` | `PERF-05`, `COGN-02`, `DATA-06`, `PERF-07`, `PERF-08`, `PERF-09`, `PERF-10` |

## Resolved Since Last Audit

All 41 findings from 2026-10-14 were resolved before this run; none of them recurs except `COLOR-04` (below, regressed).

---

## Findings

Counts: 🔴 Critical 0 · 🟠 High 4 · 🟡 Medium 12 · 🔵 Low 9 (25 total: 24 new, 1 regressed). Quick wins: 7.

### 🟠 High

#### [SEC-01] Job-link autofill can be made to fetch internal addresses
- **Severity:** High (Harms × Edge). **Confidence:** Code-confirmed. **Effort:** Medium. **Priority:** Now. **Theme:** A
- **Location:** [`lib/security/url-validator.ts`](../../lib/security/url-validator.ts#L1), [`lib/scraper.ts`](../../lib/scraper.ts#L151), [`lib/parsers/utils.ts`](../../lib/parsers/utils.ts#L57)
- **Problem:** the validator checks the hostname text only. `fetch` and Playwright follow redirects by default, and names such as `127.0.0.1.nip.io` resolve to private addresses without matching the block list. A signed-in user can submit a link that redirects to an internal service; the fetched text is passed to Gemini and the description comes back.
- **Recommendation:** fetch with `redirect: "manual"` and re-validate each hop (cap at 5); resolve DNS and reject private, loopback and link-local results; apply the same check to Playwright through request interception.
- **Acceptance:** a URL that 302s to `http://169.254.169.254/` and a hostname resolving to `127.0.0.1` both return "This link can't be read" without a request to the private address; unit tests cover both.

#### [SEC-02] Updating an application can write history into someone else's application
- **Severity:** High (Harms × Edge). **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Now. **Theme:** A
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L731)
- **Problem:** the lookup of the current row is user-scoped, but when it finds nothing `statusChanged` is true and the history query, insert and 15-minute update use only `applicationId`. The user-scoped row update changes 0 rows while the history write lands on the other user's application, corrupting their timeline, stage filters and analytics. It needs the target's UUID, so reach is low, but it is an authorization bypass.
- **Recommendation:** `if (!currentApp[0]) throw new Error("Application not found")` before any write, and scope the history update through a join to `job_applications.user_id`.
- **Acceptance:** calling `updateApplication` with another user's id throws and writes no history row (test in `app/actions/__tests__`).

#### [SEC-03] A user can sign links to another user's resume
- **Severity:** High (Harms × Edge). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Now. **Theme:** A
- **Location:** [`app/actions/documents.ts`](../../app/actions/documents.ts#L80)
- **Problem:** `createFile` stores whatever `file_key` the client sends. Storing `"<otherUserId>/<ts>-cv.pdf"` and then calling `getViewUrl` signs a GET for that object. Only `deleteFile` checks the `${userId}/` prefix.
- **Recommendation:** reject keys that do not start with `${userId}/` in `createFile`, `getViewUrl` and `getDownloadUrl`; better, record the key issued by `generatePresignedUrl` server-side and accept only that.
- **Acceptance:** `createFile` with a foreign prefix fails; view and download of such a row fail; test added.

#### [PERF-03] Bulk actions send one request per row, one at a time
- **Severity:** High (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Medium. **Priority:** Next. **Theme:** C
- **Location:** [`hooks/use-data-table.ts`](../../app/(pages)/applications/hooks/use-data-table.ts#L335)
- **Problem:** `Promise.allSettled(selectedRows.map(deleteApplication))` looks parallel, but Next.js dispatches server actions one at a time per client (`node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, "Sequential dispatch"). Each action revalidates the page, so a 25-row bulk edit is 25 round trips and 25 re-renders.
- **Recommendation:** `deleteApplications(ids)` and `updateApplicationsStatus(ids, category)` actions: one scoped `inArray` write plus history rows in one `db.batch`, one revalidation.
- **Acceptance:** bulk-deleting 25 rows sends one action request; the UI updates once.

### 🟡 Medium

#### [TRUST-10] Changing the stage also saves unsaved edits, and a failed save is not undone
- **Severity:** Medium (Impedes × Core). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Now. **Theme:** B
- **Location:** [`application-detail-sheet.tsx`](../../app/(pages)/applications/components/application-detail-sheet.tsx#L508)
- **Persona:** a job seeker fixing a typo in the role title who then updates the stage expects only the stage to save.
- **Problem:** the payload spreads `activeApp` (the draft), so pending inline edits are persisted; "Discard" then cannot undo them. The UI is updated before the await and the catch only shows a toast, so after a failure the sheet shows a status the server rejected.
- **Recommendation:** build the payload from `currentApp` with only `status`/`statusCategory` changed; patch the draft's status separately; keep the previous value and restore it in the catch.
- **Acceptance:** edit the title, change the stage: the stage saves, the title stays an unsaved draft. With the action forced to fail, the stage select returns to its old value.

#### [TRUST-11] The sheet can show and delete the wrong application's timeline
- **Severity:** Medium (Harms × Edge). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Now. **Theme:** B
- **Location:** [`application-detail-sheet.tsx`](../../app/(pages)/applications/components/application-detail-sheet.tsx#L205)
- **Problem:** history requests are not cancelled or checked. Change a status, press J before it finishes, and the old application's history can replace the new one's. Deleting an entry from that list deletes it from application A while the returned status is applied to application B.
- **Recommendation:** ignore responses whose application id is not the one currently shown (a `cancelled` flag in the effect, and an id check after each post-save refetch).
- **Acceptance:** with responses delayed, J/K never shows another application's entries (component test with a deferred mock).

#### [TRUST-12] A background refresh discards unsaved edits
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Now. **Theme:** B
- **Location:** [`hooks/use-data-table.ts`](../../app/(pages)/applications/hooks/use-data-table.ts#L176)
- **Problem:** any revalidation (attaching a resume, another tab's change) produces new row objects; `setSelectedApp(match)` gives the sheet a new `initialApp`, and its reset effect overwrites the draft with `isDirty = false`. The unsaved-changes guard never sees it.
- **Recommendation:** key the reset on `initialApp?.id`; when the id is unchanged and the draft is dirty, merge only server fields the user has not touched.
- **Acceptance:** edit notes, attach a resume: the notes edit is still there and still marked unsaved.

#### [TRUST-09] Analytics may show old numbers right after an edit
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Now.
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L111)
- **Problem:** `revalidateTag(tag, "max")` marks the analytics dataset stale-while-revalidate, so the first visit after a change can serve the cached version (`revalidateTag.md`: "stale content is served while fresh content is fetched").
- **Recommendation:** in server actions use `updateTag(applicationsTag(userId))` (read-your-own-writes); in the cron route use `revalidateTag(tag, { expire: 0 })`.
- **Acceptance:** change a status, open Analytics: the counts already include it (production build, real database).

#### [TRUST-08] Ghosted entries are dated before later activity
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Next. **Theme:** D
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L206); mock path in `lib/mock-data/mock-store.ts`
- **Problem:** the Ghosted history entry is dated `date_applied + 30 days`. For an application applied 90 days ago and moved to review 45 days ago, the timeline lists review as the newest entry while the badge says Ghosted, and deleting an older entry re-derives the status from that newest entry, which un-ghosts the application.
- **Recommendation:** date the entry at `ghostsAt` (latest activity + 30 days, capped at now), already defined in `lib/analytics/definitions.ts`, in both the database and mock sync.
- **Acceptance:** in the scenario above, Ghosted is the newest timeline entry; unit test on both paths.

#### [PERF-04] Moving or deleting an application waits for the server
- **Severity:** Medium (Impedes × Core). **Confidence:** Code-confirmed. **Effort:** Medium. **Priority:** Next.
- **Location:** [`applications-kanban.tsx`](../../app/(pages)/applications/components/applications-kanban.tsx#L241), [`row-actions.tsx`](../../app/(pages)/applications/components/row-actions.tsx#L63)
- **Problem:** after a drop, arrow move, "Move to" or delete, the card stays put until the action and the full page re-render return (up to 16 queries on the board). Only a dimmed state shows progress.
- **Recommendation:** `useOptimistic` over the board columns and table rows; roll back with a toast on failure.
- **Acceptance:** a dropped card appears in its new column immediately; a forced failure moves it back.

#### [PERF-05] The board's first load runs about 16 queries
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Medium. **Priority:** Later. **Theme:** C
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L499)
- **Problem:** each of 7 columns runs rows plus a count; status counts and platforms add two more. Each is a separate HTTPS request on the Neon HTTP driver.
- **Recommendation:** one query with `row_number() over (partition by status_category ...) <= 20` and one grouped count, or a single `db.batch`; fold the table's count into the rows query with `count(*) over()`.
- **Acceptance:** the board load issues 3 or fewer queries.

#### [PERF-06] Rarely used interaction code ships in the first page load
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Next.
- **Location:** [`data-table.tsx`](../../app/(pages)/applications/data-table.tsx#L9), [`columns.tsx`](../../app/(pages)/applications/columns.tsx#L31)
- **Problem:** the detail sheet (about 2,100 lines with its view), edit sheet, attach-resume dialog, add form and react-day-picker are static imports. `columns.tsx` and the form call `insertApplicationSchema.omit()` at runtime, pulling Drizzle and the schema into the browser (about 10 KB gzip).
- **Recommendation:** load the sheet, dialogs and form with `next/dynamic` and mount them only when open (preload on row hover); derive client types with `import type`.
- **Acceptance:** the `/applications` first-load JS no longer contains `application-detail-view`, `react-day-picker` or `drizzle-orm` modules (check the production build output).

#### [HIER-10] Board card titles are cut short or overflow the card
- **Severity:** Medium (Impedes × Common). **Confidence:** Observed. **Effort:** Low. **Priority:** Next.
- **Location:** [`kanban-card.tsx`](../../app/(pages)/applications/components/kanban-card.tsx#L113)
- **Evidence:** at 1440px a 246px card gives normal titles a 122px text box, so "Senior Frontend Engineer" shows as "Senior Frontend…"; long unbroken titles grow to 259px and run 42px past the card edge ([screenshot](../screenshots/2026-10-21-applications/board-1440.png)).
- **Persona:** a job seeker scanning the Interviewing column cannot tell two "Senior Frontend…" roles apart without opening each.
- **Recommendation:** give the title its own row (actions absolutely positioned in the corner, title with `pr-8`), `min-w-0 flex-1` on the text column, and `[overflow-wrap:anywhere]` for long tokens.
- **Acceptance:** at 1440px, titles use the full card width less the menu; no text crosses the card edge.

#### [FLOW-03] Selection and J/K navigation stop at the page boundary
- **Severity:** Medium (Impedes × Common). **Confidence:** Observed. **Effort:** Medium. **Priority:** Next.
- **Location:** [`data-table-grid.tsx`](../../app/(pages)/applications/components/data-table-grid.tsx#L1), detail-sheet navigation
- **Evidence:** with 23 applications the mobile list offers "Select all (10)" and the sheet shows "6 / 10" ([screenshot](../screenshots/2026-10-21-applications/detail-1440.png)).
- **Persona:** a user cleaning up 40 ghosted applications has to bulk-delete page by page; a user reviewing applications with J/K hits a dead end at row 10.
- **Recommendation:** after "select page", offer "Select all N matching" (bulk actions then send the filter, not ids); let J/K at the last row load the next page.
- **Acceptance:** with 23 matching rows, one bulk action can cover all 23; J at row 10 opens row 11.

#### [COLOR-04] Status pill count badges fail contrast (regressed)
- **Severity:** Medium (Impedes × Core). **Confidence:** Observed. **Effort:** Quick Win. **Priority:** Now.
- **Location:** [`status-filter-pills.tsx`](../../app/(pages)/applications/components/status-filter-pills.tsx#L66)
- **Evidence:** axe and computed styles: `#677183` on `#ebecf0`, 12px, **4.16:1** (needs 4.5:1, WCAG 1.4.3), on all six inactive pills in light mode. The muted tokens are unchanged since before the 14 Oct fix, so that fix never covered these badges.
- **Recommendation:** use `text-foreground/80` on `bg-muted`, or `text-muted-foreground` on `bg-card` with a border.
- **Acceptance:** axe reports 0 `color-contrast` violations on `/applications` in light mode.

#### [COGN-02] Three ways to edit one application, five ways to change its status
- **Severity:** Medium (Impedes × Common). **Confidence:** Code-confirmed. **Effort:** High. **Priority:** Later.
- **Location:** [`application-detail-view.tsx`](../../app/(pages)/applications/components/application-detail-view.tsx), `application-detail-sheet.tsx`, `app/_components/edit-application-sheet.tsx`
- **Problem:** inline per-field edits, the sheet's "Edit Details" form and a separate edit sheet from the row menu all edit the same record, each with its own dirty guard; status changes through the row menu, the sheet's stage select plus custom-detail field, board drag and arrows, bulk "Mark Status" and the form. This is the root of `TRUST-10`/`TRUST-12` and most of the sheet's 2,100 lines.
- **Recommendation:** keep inline editing in the sheet as the one edit model; make the row menu's "Edit" open the sheet; route every status change through one `moveApplication(id, category, detail?)` action.
- **Acceptance:** one edit component and one status action remain; the existing e2e suite passes.

### 🔵 Low

#### [FORM-04] Server actions accept unvalidated input
- **Severity:** Low (Annoys × Edge). **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Next. **Theme:** A
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L61), inline link edit in `application-detail-sheet.tsx:762`
- **Problem:** `formSchema` is defined but unused. An inline link edit saves `company.com/job`, which the sheet, board card and mobile card render as a relative link to `/applications/company.com/job` (the table adds `https://`, so behaviour differs by view). Clearing the inline date saves the server's "today". `javascript:` links are already neutralised by React 19.
- **Recommendation:** parse with the zod schema in create/update; one shared `normalizeJobLink` used on save and render.
- **Acceptance:** saving `company.com/job` stores `https://company.com/job`; an empty date is rejected with a message.

#### [TRUST-13] Ghost sync can overwrite a just-made status change
- **Severity:** Low (Impedes × Edge). **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Next. **Theme:** D
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L229)
- **Problem:** the update uses only `inArray(id, qualifyingIds)`, so a move to Interviewing between the select and the update is overwritten. After create, the sync starts unawaited and outside `after()`, so on serverless it can be cut off.
- **Recommendation:** add `inArray(statusCategory, ["applied","review"])` to the update; run the post-create sync in `after()`.
- **Acceptance:** an application moved to Interviewing during a sync stays Interviewing.

#### [DATA-06] Salary sorts as text
- **Severity:** Low (Annoys × Edge). **Confidence:** Code-confirmed. **Effort:** Medium. **Priority:** Later.
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L353)
- **Problem:** "$90k" sorts above "$210,000". Structured salary fields (see Missing, #7) fix this properly; until then, sort by the parsed annual value from `lib/analytics/salary.ts`.
- **Acceptance:** sorting by salary orders $90k below $210,000.

#### [FLOW-04] A status pill drops the date range from an analytics link
- **Severity:** Low (Annoys × Edge). **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Next.
- **Location:** [`hooks/use-data-table.ts`](../../app/(pages)/applications/hooks/use-data-table.ts#L123)
- **Problem:** arriving from Analytics with `?from&to` and tapping "Rejected" clears the range, so the user sees all-time rejections instead of the period they were looking at.
- **Recommendation:** keep `from`/`to` when a pill is picked (clear only `stage`); the filter chip already lets the user remove the range.
- **Acceptance:** from an analytics link, tapping a pill keeps the date chip.

#### [SRCH-02] Search ignores notes
- **Severity:** Low (Annoys × Common). **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Now.
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L324), mock `searchableText`
- **Problem:** notes are where users write recruiter names and referrers ("Add referral contacts…" is the placeholder), but search covers description and salary, not notes.
- **Recommendation:** add `notes` to both search paths; drop `statusCategory` and `description` from the ILIKE list if `PERF-10` is taken.
- **Acceptance:** searching a name that appears only in notes finds the application.

#### [PERF-07] Detail sheet makes duplicate reads
- **Severity:** Low. **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Later. **Theme:** B
- **Location:** [`application-detail-sheet.tsx`](../../app/(pages)/applications/components/application-detail-sheet.tsx#L186)
- **Problem:** every save refetches history twice (explicitly and through the object-keyed effect), and `getDocument` runs even though the row already carries the resume title, file name and size. Server-action reads are queued, so these delay the next action.
- **Acceptance:** opening a row sends at most two reads; saving sends one refetch.

#### [PERF-08] Each search keystroke re-renders both layouts
- **Severity:** Low. **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Later.
- **Location:** [`data-table-toolbar.tsx`](../../app/(pages)/applications/components/data-table-toolbar.tsx#L69)
- **Problem:** the input is bound to URL state, so every keystroke re-renders the table and the hidden mobile cards (about 70 ms per keystroke in dev with 10 rows).
- **Recommendation:** local input state pushed to the URL on the debounce; memoize the grid and cards.

#### [PERF-09] The add/edit form reads every row's location and platform
- **Severity:** Low. **Confidence:** Code-confirmed. **Effort:** Quick Win. **Priority:** Later. **Theme:** C
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L992)
- **Recommendation:** `selectDistinct`, cached with `applicationsTag(userId)`.

#### [PERF-10] Search and platform filter cannot use indexes
- **Severity:** Low. **Confidence:** Code-confirmed. **Effort:** Low. **Priority:** Later.
- **Location:** [`app/actions/applications.ts`](../../app/actions/applications.ts#L316)
- **Problem:** ILIKE over eight columns including the long description; `lower(trim(platform)) = $1` although platform is already stored trimmed and lowercased.
- **Recommendation:** `eq(platform, value)`; trim the ILIKE list; a `pg_trgm` index when accounts grow.

---

## Missing for 2026/2027

At 2-5% application-to-interview rates, users send many applications; Huntr's Q1 2026 data shows people sending 11-20 applications interviewing at 9.25% per application against 2.58% for 100+ ([Huntr](https://api.huntr.co/research/job-search-trends-q1-2026)). The tracker's job is to keep that volume organised and point at the next action. Competitors lead with follow-up reminders, contacts and quick capture ([Huntr](https://huntr.co/product/job-tracker), [Careerflow](https://www.careerflow.ai/job-tracker), [Simplify](https://simplify.jobs/copilot)). Each item below was checked against the schema and components.

| # | Feature | Why it matters | Builds on | Effort |
| :--- | :--- | :--- | :--- | :---: |
| 1 | **Follow-up date and a "due" view in the tracker** | Follow-ups are the main lever a job seeker controls; today "Needs action" exists only on Analytics, and a follow-up is never recorded, so the ghost timer ignores it. | `needsAction` in `lib/analytics/summarize.ts`, a `?due=` param, the timeline | S-M |
| 2 | **Duplicate warning on add** | Reapplying by accident is common at 100+ applications. | Link normalisation in the autofill bar; company + role match in the last 90 days | S |
| 3 | **Interview events (date, time, round, .ics)** | The only place for interview details is the free-text status. | A child table modelled on `application_status_history` | M |
| 4 | **Contacts and a referral flag** | Referrals convert far better than cold applications; the notes placeholder already asks for contacts. | New table plus a sheet section; referral becomes an analytics dimension | M |
| 5 | **Archive instead of delete, with undo** | Delete is permanent; archiving keeps closed applications out of the board while analytics keeps them. | Toast system, `STATUS_GROUPS.closed` | S-M |
| 6 | **Date range and location/remote filters in the toolbar** | `from`/`to` already work but have no control; location is free text with no work-mode filter. | Existing params, analytics period picker, `workMode()` | S |
| 7 | **Structured salary (min, max, currency, period)** | Needed for exact sorting (`DATA-06`) and offer comparison. | `lib/analytics/salary.ts`, `salaryCurrency` preference | M |
| 8 | **CSV import** | Most people start in a spreadsheet. | `applicationsToCsv` columns in reverse, batch insert | M |
| 9 | **Export the current view** | Export exists in Settings (all) and Analytics (by period), not for the tracker's filters. | `/api/analytics/export` | S |
| 10 | **Tags and priority** | Helps choose which applications to tailor and chase. | New columns or table | S-M |
| 11 | **Quick status change on mobile cards** | Desktop rows and board cards have "Move to"; mobile cards require opening the sheet. | `RowActions` `moveTo` | S |
| 12 | **Saved views and column visibility** | Filters are already in the URL; a saved view is a named query string. | `user_preferences` | M |

## Redundant

- **Edit and status paths:** see `COGN-02`.
- **Dead toolbar props:** `isMobileFilterOpen`, `statusFilter`, `setStatusFilter` are declared and destructured in `data-table-toolbar.tsx` but never used, and `Badge` is imported but unused; `isMobileFilterOpen` state is threaded through `use-data-table.ts` for nothing.
- **Stored `month` and `year`:** derived from `date_applied` and indexed, but analytics no longer reads them.
- **Required `link`, `platform` and `location`:** `notNull` columns force placeholder values for referrals and recruiter outreach.
- **Two redundant indexes:** `job_apps_user_id_idx` and `status_history_app_id_idx` are prefixes of composite indexes.
- **Unused import:** `unstable_cache` in `app/actions/applications.ts`.

## To Verify

| Item | Why it needs checking |
| :--- | :--- |
| `TRUST-09` in production | Stale-while-revalidate behaviour is from the Next.js docs; confirm on a production deploy with the real database. |
| Mock path divergence | The mock store returns success for unknown history ids, has no 15-minute coalescing and no synthetic ghosted entry; affects the demo only. |
| Resume "use existing" toast | `handleUseExisting` may show success when the attach failed because the detail view swallows the error. |

## Coverage

| Pass | Done | Notes |
| :--- | :---: | :--- |
| Task walkthrough | ✓ | Add, scan, filter, open, edit, change stage, bulk, board move. |
| State inventory | ✓ | Empty, filtered-empty, loading skeleton, error boundary, saving, failure paths. |
| Heuristic sweep | ✓ | All in-scope files against the 22 categories. |
| Accessibility | ✓ | axe at 320/375/768/1440 light and 375/1440 dark; keyboard walk (40 stops); target sizes. |
| Visual craft | ✓ | Table, board, sheet, add dialog screenshots. |
| Content | ✓ | Labels and messages. |
| Security and correctness | ✓ | Server actions, ownership, races, ghost sync (added for this run). |
| Performance | ✓ | Queries per view, bundle composition, re-renders (added for this run). |

**Personas:** the high-volume applicant (100+ applications, desktop; `FLOW-03`, `PERF-03`, Missing #1); the commuter on a phone (`FLOW-03`, Missing #11); the careful editor using the detail sheet with the keyboard (`TRUST-10/11/12`, J/K); a low-vision user in light mode (`COLOR-04`).

**Checked and cleared:** inspector "obscured focus" on Privacy/Terms (covered by the dev-only Next.js overlay); "no focus change" on 4 buttons (animated ring, confirmed by screenshot); `?view=board` showing the list (the param is `view=kanban`); LIKE escaping; read scoping; pagination clamping; sort stability; date range inclusivity; `javascript:` links (React 19 blocks them); Kanban "Show more" dedupe.

## Appendix

**Method:** `inspect_page.js` on `/applications?view=table`; Playwright probes for focus, board card geometry and badge colours; source review by three parallel reviewers (functional and security, performance, product gaps), each finding re-checked against the code before inclusion. Screenshots: [table 1440](../screenshots/2026-10-21-applications/table-1440.png), [table 375](../screenshots/2026-10-21-applications/table-375.png), [board 1440](../screenshots/2026-10-21-applications/board-1440.png), [detail 1440](../screenshots/2026-10-21-applications/detail-1440.png).

**Files reviewed:** `app/(pages)/applications/**` (page, layout, loading, error, data-table, columns, hooks/use-data-table, all components), `app/actions/applications.ts`, `app/actions/documents.ts`, `lib/applications/list-query.ts`, `app/_components/application-form*.tsx`, `app/_components/edit-application-sheet.tsx`, `app/_components/link-autofill-bar.tsx`, `app/api/extract/route.ts`, `lib/scraper.ts`, `lib/parsers/utils.ts`, `lib/security/url-validator.ts`, `lib/mock-data/mock-store.ts`, `app/db/schema.ts`.
