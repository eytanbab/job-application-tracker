# UX Audit: Analytics (`/analytics/overview`)

> **Verdict:** The rebuilt Analytics page is calm and consistent, renders as fast as Applications, and every section has a designed empty state. The biggest risk is trust: salary figures are computed wrongly for common inputs, "interview rate" and "response rate" mean different things in different sections, and the page names a "top-performing source" from 5 applications, so a job seeker can act on numbers that are wrong or are noise. The most valuable next move is one tested metrics layer with sample-size rules, a fixed salary parser, and an accessible chart, followed by trimming the duplicated tiles so the page answers "what should I do this week?".

| | |
| :--- | :--- |
| **Date** | 2026-10-21 (second pass the same day added `DATA-05`, `A11Y-12`, `PLAT-02`, `COPY-04`, `PERF-02` and the `PERS-01` regression) |
| **Scope** | Analytics overview: 1 screen, 5 sections (KPI strip, funnel, platforms, work model and salary, activity chart), filter bar and states; 22 files ([details](#files-reviewed)) |
| **Mode** | Interactive (mock mode, `http://localhost:3100`; production build on `:3200` for timing) + source |
| **Personas** | Maya (power user), Daniel (mobile), Noa (keyboard and screen reader), Lior (career switcher, first months of search) ([details](#personas)) |
| **Previous audit** | 2026-10-12 (analytics, before the single-page rebuild) |

---

## Scorecard

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| Visual design & craft | 4 | Clean cards and good dark mode; status colours come from three palettes and a lot of text is 10-11px (`COLOR-06`, `TYPO-02`). |
| Content & clarity | 4 | Plain headings and specific empty copy; captions describe a different metric from the one shown, one concept has three names, and the filtered empty state gives the wrong advice (`COPY-03`, `COPY-04`, `STATE-02`). |
| Interaction & flow | 3 | Filters live in the URL and links into the tracker work; but rankings rest on tiny samples, numbers repeat, nothing drills down, and the filter only knows calendar months (`DATA-05`, `COGN-01`, `FLOW-02`, `SRCH-01`, `DATA-04`). |
| Feedback & trust | 3 | Wrong salary values, conflicting rate definitions, and a late banner that shifts the page (`TRUST-06`, `TRUST-07`, `PERF-02`, `PERF-01`). |
| Accessibility | 3 | Landmarks, an h1, labelled selects and working reflow at 320px; but the chart's data cannot be read with a screen reader and sort and toggle states are not announced (`A11Y-12`, `A11Y-10`, `COLOR-06`, `A11Y-11`). |
| Platform fit | 4 | Mobile is designed (platform cards, sort select, two-column filter); the tablet table collides and view state resets on refresh (`PLAT-02`, `PERS-01`). |

*1 Broken · 2 Poor · 3 Adequate · 4 Good · 5 Excellent · n/a Not evaluable in this mode. Scores follow the rubric, so they can be compared across audits.*

---

## What's Working

- **Filters are URL state.** Month and year are read with `nuqs` ([`analytics-filter.tsx:33`](../../app/(pages)/analytics/components/analytics-filter.tsx#L33)) and old routes (`/analytics/insights`, `/status-per-platform`) redirect with the filter kept. Refresh, Back and shared links land on the same view. Keep this when adding date ranges.
- **Every section has a designed empty state.** Zero applications, zero platforms, zero salary data and zero work-model data each get a short sentence instead of a broken chart (evidence: `empty-month/1440w.png`). Rates show a dash rather than a misleading 0.0%.
- **Small samples are at least marked on platforms.** Platforms with fewer than 3 applications show "2/2 (early)" instead of "100%" ([`channel-performance-matrix.tsx:334`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L334)). The idea is right; `DATA-05` asks for a higher bar and the same rule on the work model.
- **Reflow and motion are handled.** No horizontal scroll at 320px (WCAG 1.4.10), no animation runs under `prefers-reduced-motion`, all 37 icons are `aria-hidden`, and the chart supports arrow keys through Recharts' `accessibilityLayer`.
- **Deep links into the tracker work.** "View" on a platform row opens `/applications?platform=Greenhouse` with 5 rows, and the top-salary arrow opens a search for that company (both checked in the running app).

---

## Top Priorities

1. **Make every number on the page mean one thing, and only claim what the data supports**: one shared definition of "reached interview", "responded" and "ghosted", plus one sample-size rule, used by the funnel, platform table and work model, with unit tests. Today the work model counts 7 interviews where the funnel counts 8, and Greenhouse is called "top-performing" on 3 of 5 applications. Resolves [`TRUST-07`](#trust-07-interview-and-response-rates-use-different-definitions-across-sections), [`DATA-05`](#data-05-top-performing-source-and-work-model-rates-are-presented-as-findings-from-3-8-applications). Effort: Low.
2. **Show salary numbers people can trust**: stop counting bonus percentages, 401k and hourly or monthly pay as annual salary, and stop printing `$` for every currency. Resolves [`TRUST-06`](#trust-06-salary-parser-turns-bonuses-401k-and-hourlymonthly-pay-into-wrong-annual-figures). Effort: Low (parser), Medium (structured salary fields).
3. **Let screen-reader users read the chart and controls, and say what each number measures**: a data table behind the chart, `aria-pressed` and `aria-sort`, and rewritten captions with one term per concept. Resolves [`A11Y-12`](#a11y-12-activity-chart-and-view-toggle-are-not-exposed-to-screen-readers), [`A11Y-10`](#a11y-10-platform-table-sort-state-is-not-announced), [`COPY-03`](#copy-03-metric-labels-describe-something-other-than-what-is-measured), [`COPY-04`](#copy-04-one-concept-has-several-names). Effort: Low.

---

## Themes

### Theme A: There is no single metrics layer
Each section computes its own rates from raw rows: the funnel uses status history, the work model uses only the current status, and the platform table defines "responded" differently again. Sample-size rules exist for platforms only. A second copy of all of it lives in `lib/mock-data/mock-store.ts`. Nothing is unit-tested (FEATURES.md lists this as open).
- **Findings**: `TRUST-06`, `TRUST-07`, `DATA-05`, `COPY-03`, `PERF-01`
- **Systemic fix**: One server function loads the filtered applications and their history once, and pure helpers in `lib/analytics/` (`reachedInterview`, `responded`, `parseSalary`, `rateWithInterval`, `summarize`) produce every number. The mock store returns rows and reuses the same helpers. Add Vitest cases for each helper.

### Theme B: The page reports, it does not guide
The page restates totals in three places but has no time dimension at the top (this week vs last), no list of things to act on, and no path from a number to the applications behind it.
- **Findings**: `COGN-01`, `FLOW-02`, `SRCH-01`, `STATE-02`, `PERS-01`
- **Systemic fix**: Reorganise around three questions: "How am I doing vs last period?" (KPIs with deltas), "Where is my pipeline stuck?" (funnel with clickable stages, stale list), "What works?" (platforms, work model, salary). Keep every view choice in the URL. See [Missing for 2026/2027](#missing-for-20262027).

### Theme C: Charts are drawn, not designed as data
Status colours are hex in the chart, Tailwind palette classes in the platform bars, and `--status-*` CSS tokens in the tracker; the `dataviz` validator fails the chart palette. The chart has no accessible equivalent, no surface gaps, dashed gridlines and clipped axis labels. Type sizes are arbitrary `text-[10px]` / `text-[11px]` values with monospace used for sentences.
- **Findings**: `COLOR-06`, `A11Y-12`, `DATA-04`, `TYPO-02`, `PLAT-02`
- **Systemic fix**: One `statusColor(kind)` map built on the `--status-*` tokens and validated with `validate_palette.js` in both themes, used by the chart, bars and badges; every chart ships with an `sr-only` table; a minimum caption size of 12px; monospace only for numbers.

---

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `TRUST-06` Salary values wrong | `STATE-02` Filtered empty state says "add your first application" | `PERS-01` View state resets on refresh (regressed) |
| `TRUST-07` Conflicting rate definitions | `DATA-04` Activity chart defects | |
| `DATA-05` Claims from tiny samples | `COLOR-06` Status colours, contrast, red/green | |
| `A11Y-12` Chart and toggle not accessible | `TYPO-02` Tiny and monospace text | |
| `COPY-03` Misleading metric captions | `FLOW-02` No drill-down | |
| `COPY-04` Three names for one concept | `COGN-01` Duplicated metrics | |
| `A11Y-10` Sort state not announced | `PERF-01` Blocking data fetch | |
| `PLAT-02` Tablet table headers overlap | `PERF-02` Guest banner shifts the page | |
| | `SRCH-01` Calendar-only filter | |
| | `A11Y-11` Heading levels (polish) | |

**At a glance:** 🔴 0 Critical · 🟠 4 High · 🟡 13 Medium · 🔵 2 Low · ⚡ 5 Quick Wins · 4 to verify

---

## Resolved Since Last Audit

Of the 12 analytics findings from 2026-10-12 (`DATA-01`, `DATA-02`, `COLOR-01`, `A11Y-01`-`03`, `TRUST-01`, `TRUST-02`, `STATE-01`, `AFFORD-01`, `PERS-01`, `HIER-01`), 11 stay resolved: filter selects keep their `aria-label`s, the page has an h1, and the top-platform threshold is one rule. **`PERS-01` has regressed**: the Platform ROI dashboard that persisted its view was replaced by `ChannelPerformanceMatrix`, which keeps sort, search and expansion in `useState` again.

---

## Findings

Ordered by priority, then severity.

| ID | Finding | Severity | Confidence | Effort | Priority | Theme |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `TRUST-06` | Salary parser produces wrong annual figures | 🟠 High | Observed | Low | Now | A |
| `TRUST-07` | Interview and response rates use different definitions | 🟠 High | Observed | Low | Now | A |
| `DATA-05` | "Top-performing" and work-model rates from 3-8 applications | 🟠 High | Observed | Low | Now | A |
| `A11Y-12` | Chart data and view toggle unreadable by screen readers | 🟠 High | Observed | Low | Now | C |
| `COPY-03` | Metric labels describe something else | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Now | A |
| `COPY-04` | One concept has several names; mixed casing | 🟡 Medium | Code-confirmed | ⚡ Quick Win | Now | |
| `A11Y-10` | Sort state not announced; "(early)" at 2.95:1 | 🟡 Medium | Observed | ⚡ Quick Win | Now | |
| `PLAT-02` | Tablet: table headers overlap, funnel headers wrap | 🟡 Medium | Observed | ⚡ Quick Win | Now | C |
| `STATE-02` | Filtered empty state gives first-run advice | 🟡 Medium | Observed | Low | Next | B |
| `DATA-04` | Activity chart clipping, tooltip noise, missing "Other" | 🟡 Medium | Observed | Low | Next | C |
| `COLOR-06` | Three status palettes; chart fails the palette validator | 🟡 Medium | Observed | Low | Next | C |
| `TYPO-02` | 43 uses of 10-11px text; captions truncate on mobile | 🟡 Medium | Observed | Low | Next | C |
| `FLOW-02` | No drill-down from funnel and KPI tiles | 🟡 Medium | Code-confirmed | Low | Next | B |
| `PERF-02` | Guest banner inserted late; CLS 0.137 on mobile | 🟡 Medium | Observed | Low | Next | |
| `COGN-01` | Offers shown 3 times, rate and total twice | 🟡 Medium | Observed | Medium | Next | B |
| `PERF-01` | Shell blocked on `getYears`, 9 full-row queries | 🟡 Medium | Code-confirmed | Medium | Next | A |
| `SRCH-01` | Only calendar month/year; month alone merges years | 🟡 Medium | Code-confirmed | Medium | Next | B |
| `A11Y-11` | h3 sections nested under "Platforms & Sources" | 🔵 Low | Observed | ⚡ Quick Win | Next | |
| `PERS-01` | View state resets on refresh (**Regressed**) | 🔵 Low | Code-confirmed | Low | Later | B |

### `TRUST-06` Salary parser turns bonuses, 401k and hourly/monthly pay into wrong annual figures

- **Severity**: 🟠 High (*Impedes × Common*): salary is the number people use to decide which roles to chase.
- **Confidence**: Observed. The parsing code was run on 10 real-world strings (`probe/salary.cjs`, same regex and rules):

  | Salary text | Parsed value | Correct |
  | :--- | :--- | :--- |
  | `$120k-$150k + 15% bonus` | **$95,000** | $135,000 |
  | `180,000 USD + 401k` | **$290,500** | $180,000 |
  | `$60/hr` | **$60,000** | ~$124,800 / year |
  | `₪25,000 / month` | **$25,000** | ₪300,000 / year |
  | `€70,000` | **$70,000** | €70,000 |
  | `Up to 40 LPA` | **$40,000** | ₹4,000,000 |

- **Effort**: Low (parser), Medium (structured fields) · **Priority**: Now · **Theme**: A
- **Location**: [`app/(pages)/analytics/insights/actions.ts:309`](../../app/(pages)/analytics/insights/actions.ts#L309); display in [`market-reality-matrix.tsx:13`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L13)
- **Persona**: **Lior** pastes "$120k-$150k + 15% bonus" from a posting. The "Average Target" drops and the range floor reads lower than any offer they saw. **Maya**, applying in Israel and the US, gets shekel monthly figures averaged with dollar annual figures.

**Problem.** Every number under 1,000 is multiplied by 1,000 and every match is averaged, so "15%" becomes $15,000 and "401k" becomes $401,000. Currency and pay period are ignored and the result is always printed with `$`. The "Highest Stated Compensation" row then shows the raw string, so the same card mixes `$214k` and `$300,000 - $350,000`.

**Recommendation.** Short term: parse only tokens attached to a currency symbol or `k`, drop tokens followed by `%`, `401k`, `days`, `weeks`; detect `/hr|hour` (×2080) and `/mo|month` (×12); skip strings whose currency differs from the user's main currency and count them as "not comparable". Long term (FEATURES.md item): store `salary_min`, `salary_max`, `currency`, `period` on the application, filled by the AI extraction, and show the median rather than the mean.

**Acceptance criteria**
- [ ] The six strings above produce the "Correct" column (or are excluded with a visible count).
- [ ] The card never shows `$` for a non-USD figure.
- [ ] Unit tests cover range, bonus, 401k, hourly, monthly and non-USD inputs.

### `TRUST-07` Interview and response rates use different definitions across sections

- **Severity**: 🟠 High (*Impedes × Core*): the platform and work-model sections exist to answer "where should I apply?", and they disagree with the funnel.
- **Confidence**: Observed. On the demo data the work model adds up to 4 + 2 + 1 = **7** interviewed applications, while the funnel and the platform table both count **8** for the same filter (`1440w.png`). Code paths:
  - Funnel and platform "interview" counts use status history ([`analytics.ts:594`](../../app/actions/analytics.ts#L594), [`:453`](../../app/actions/analytics.ts#L453)). Work model uses only the current status ([`insights/actions.ts:245`](../../app/(pages)/analytics/insights/actions.ts#L245)), so an application that interviewed and was then rejected or ghosted counts as an interview in the funnel but not under Remote/Hybrid/On-site.
  - Platform "response rate" counts only the *current* status `interview`/`accepted`/`rejected` ([`channel-performance-matrix.tsx:102`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L102)). "In Review" is not a response, and an application that interviewed and was later ghosted is an interview but not a response, so response rate can be lower than interview rate.
  - Blank or unrecognised locations are counted as "On-site" ([`insights/actions.ts:228`](../../app/(pages)/analytics/insights/actions.ts#L228)).
  - "Other" statuses are counted as active "applied" with no label ([`analytics.ts:622`](../../app/actions/analytics.ts#L622)).
- **Effort**: Low · **Priority**: Now · **Theme**: A
- **Persona**: **Maya** compares Remote vs On-site to decide whether to keep applying on-site. On-site looks worse partly because every application with an empty location lands there, and Remote under-counts interviews that later went quiet.

**Problem.** Users compare numbers across sections and assume the same word means the same thing (consistency, Nielsen #4). The earlier audit fixed this for "ghosted" and "top platform" (`TRUST-01`, `TRUST-02`); the rebuild reintroduced it for "interview" and "response".

**Recommendation.** Add `lib/analytics/metrics.ts` with `reachedInterview(app, history)`, `responded(app, history)` (any non-applied, non-ghosted status ever recorded), and `workMode(location)` returning `"unknown"` for blanks. Use them in all three server functions and in the mock store. Show an "Unknown" row in the work model when it is non-zero.

**Acceptance criteria**
- [ ] For the same filter, the sum of platform interview counts equals the funnel interview count (excluding blank platforms).
- [ ] Response rate is never lower than interview rate for any row.
- [ ] Applications with empty location appear as "Unknown", not "On-site".

### `COPY-03` Metric labels describe something other than what is measured

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Code-confirmed.
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: A
- **Location**: [`kpi-summary-strip.tsx:136`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx#L136), [`pipeline-health-hero.tsx:96`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L96), [`:211`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L211), [`:219`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L219), [`market-reality-matrix.tsx:122`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L122)
- **Persona**: **Lior** reads "7 days from applied to recruiter response" and plans follow-ups around it, but the number is how long Lior took to update the tracker.

**Problem.** Response time is computed from status-history timestamps, which record when the user changed the status, not when the employer replied. "No Response (30+ Days)" is the ghosted count, which includes applications ghosted after an interview and ones marked ghosted by hand. The offer caption counts applications, not "interview rounds". "Yield" is recruiting jargon.

**Recommendation.**

| Where | Current | Proposed |
| :--- | :--- | :--- |
| Avg. response caption | "From applied to recruiter response" | "Days from applying to your first status update" |
| Outcome card title | "No Response (30+ Days)" | "Ghosted" with caption "No reply, marked ghosted (auto after 30 days)" |
| Outcome caption | "1 of 8 interview rounds converted" | "1 of 8 interviewed applications became an offer" |
| Funnel badges | "44.4% yield" | "44% reached interview" / "13% got an offer" |
| Salary tile | "Average Target" | "Median stated salary" (with `TRUST-06`) |

**Acceptance criteria**
- [ ] No caption on the page uses "recruiter response", "rounds" or "yield".

### `A11Y-10` Platform table sort state is not announced

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed. All six `<th>` have no `aria-sort` (checked in the DOM). axe flags the "(early)" label at 2.95:1 (`#8c93a1` on `#f9fafb`, 10px), WCAG 1.4.3.
- **Effort**: ⚡ Quick Win · **Priority**: Now
- **Location**: [`channel-performance-matrix.tsx:397`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L397), [`:443`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L443)
- **Persona**: **Noa** presses "Interview Rate" and hears only "Interview Rate, button"; the arrow icon is the only sign of the new order.

**Recommendation.**
```diff
- <TableHead className="w-[18%] py-2.5 px-3 text-center">
+ <TableHead
+   className="w-[18%] py-2.5 px-3 text-center"
+   aria-sort={sortField === "interviewRate" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
+ >
```
Apply to all four sortable headers. Remove `opacity-75` from "(early)" and use `text-muted-foreground` at 12px.

**Acceptance criteria**
- [ ] Each sortable header exposes `aria-sort`, updated on click.
- [ ] axe reports no `color-contrast` violation on the page.

### `STATE-02` A filter with no matches gives first-run advice

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed (`empty-month/1440w.png`, `?month=1` on an account with 18 applications).
- **Effort**: Low · **Priority**: Next · **Theme**: B
- **Location**: [`pipeline-health-hero.tsx:47`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L47)
- **Persona**: **Maya** picks January to compare months and is told "Add Your First Application", followed by four more cards each saying there is no data.

**Problem.** The zero state does not distinguish "no applications at all" from "none in this period". The useful action (clear or change the filter) is a small "Reset" link in the toolbar.

**Recommendation.** Pass `isFiltered` into the overview. When filtered and empty, render one card: "No applications in January (all years)" with buttons "Show all time" and "Previous month", and hide the other four sections. Keep the current card for accounts with zero applications.

**Acceptance criteria**
- [ ] A filtered empty view shows one card with a "Show all time" action and no "first application" copy.

### `DATA-04` Activity chart clips labels, lists zero rows and drops "Other"

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed (`activity-chart.png`, `activity-chart-tooltip.png`) and code-confirmed.
- **Effort**: Low · **Priority**: Next · **Theme**: C
- **Location**: [`total-applications-per-year-bar-chart.tsx:197`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L197)
- **Persona**: **Daniel**, on a phone, sees Y-axis values cut to a sliver and month labels skipped (Jan, Mar, Apr, Jun...); tapping a bar shows six rows, five of them "0".

**Problem.**
1. `margin={{ left: -15 }}` with `width={30}` cuts off the Y-axis labels at every width.
2. The tooltip lists every status including zeros and has no total.
3. `statusCategories` has no "Other", so those applications disappear from the stacked view and the month total differs from "Total Volume" (code path: `transformApplicationsData` keys by label, `statusLabels.other = "Other"`).
4. The rounded corner is applied to index 0 ("Offer"), which Recharts draws at the bottom, so the top of each stack is square.
5. The chart disappears entirely when a month is selected, with no explanation, and when a year is selected the in-chart year picker still lists years that were filtered out.

**Recommendation.** Remove the negative margin and set `width={32}`; filter zero rows in the tooltip formatter and add a total line; add `{ key: "Other" }`; apply the radius to the last bar in render order; when a month is selected, show that month's weekly bars instead of hiding the section; hide the inner year picker when the global year is set. Follow the `dataviz` rules: stack order matches the funnel (Applied at the bottom, Offer on top).

**Acceptance criteria**
- [ ] Y-axis labels fully visible at 375 and 1440.
- [ ] Tooltip shows only non-zero statuses plus a total.
- [ ] Stacked month totals equal Total Volume totals.

### `COLOR-06` Status colours come from three palettes; chart fails the palette validator

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Observed. `contrast.js` against the white card: Interview `#f59e0b` 2.14:1, Offer `#10b981` 2.53:1, Ghosted `#94a3b8` 2.56:1 (WCAG 1.4.11 asks 3:1 for chart marks). Adjacent Applied `#64748b` vs Ghosted `#94a3b8`: 1.85:1. In the platform bars, Applied (`bg-muted-foreground/40`) and Ghosted (`bg-slate-400`) look the same (`1440w.png`, LinkedIn row). The `dataviz` skill's `validate_palette.js` on the six chart colours:

  | Check | Light (`#ffffff`) | Dark (`#14171f`) |
  | :--- | :--- | :--- |
  | Chroma floor | FAIL: Applied and Ghosted read as grey | FAIL |
  | Lightness band | pass | FAIL: Offer, Interview, Ghosted too light |
  | CVD, adjacent | WARN: Rejected ↔ Applied ΔE 6.7 (protan) | WARN |
  | CVD, all pairs | **FAIL: Rejected ↔ Offer ΔE 5.6 (deutan)** | FAIL |
  | Contrast vs surface | WARN: 3 colours below 3:1 | pass |

  Red "Rejected" and green "Offer" are the classic red-green pair: for about 1 in 12 men they look alike, and they are the two outcomes a user most needs to tell apart. The chart also uses dashed gridlines (`strokeDasharray="3 3"`) and no gap between stacked segments, both listed as anti-patterns in the skill.
- **Effort**: Low · **Priority**: Next · **Theme**: C
- **Location**: [`total-applications-per-year-bar-chart.tsx:40`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L40), [`channel-performance-matrix.tsx:52`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L52), tokens in [`globals.css:95`](../../app/globals.css#L95)
- **Persona**: **Noa** (low vision) cannot tell Applied from Ghosted in the stacked bar; **Maya** sees "Applied" purple in the tracker and slate grey here.

**Recommendation.** Export one `statusColor(kind)` from `lib/utils.ts` built on the existing `--status-*` tokens (already used by `getColor`), darken amber/emerald/ghosted until each is ≥ 3:1 on `--card` in both themes, move Rejected toward rose-magenta and Offer toward teal-blue so they separate under deuteranopia, give Ghosted a hue (or a 45° texture) instead of a second grey, add a 2px card-coloured gap between stacked segments, and make gridlines solid hairlines. Re-run `validate_palette.js --pairs all` for both modes until it passes.

**Acceptance criteria**
- [ ] The chart, platform bars and tracker badges use the same colour for each status.
- [ ] Every status colour is ≥ 3:1 against the card in light and dark (`contrast.js`).
- [ ] `validate_palette.js --pairs all` passes (no FAIL) for light and dark surfaces.

### `TYPO-02` Small and monospace text; captions truncate on mobile

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed. 12 × `text-[10px]` and 31 × `text-[11px]` in the analytics folder, 34 `font-mono` uses including sentences ("(8 of 18 applied)", "100% baseline submissions", "Filtered View"). At 375px the KPI captions cut off ("5 applied · 2 review · 6 in...", "12.5% of interviews conv...") and work-model shares cut off ("8 applications (4...") (`375w.png`).
- **Effort**: Low · **Priority**: Next · **Theme**: C
- **Location**: [`kpi-summary-strip.tsx:72`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx#L72), [`market-reality-matrix.tsx:73`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L73), [`pipeline-health-hero.tsx:158`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L158)
- **Persona**: **Daniel** reads the page on a bus; the detail that explains each number is the part that is truncated.

**Recommendation.** Captions `text-xs` (12px) minimum, allow two lines instead of `truncate`, keep `font-mono tabular-nums` for numbers only.

**Acceptance criteria**
- [ ] No text under 12px on the page; no truncated caption at 375px.

### `FLOW-02` Funnel stages and KPI tiles do not open the matching applications

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Code-confirmed. "In Progress > View" links to `/applications` with no filter ([`kpi-summary-strip.tsx:59`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx#L59)); funnel stages and outcome cards are plain `div`s ([`pipeline-health-hero.tsx:144`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L144)).
- **Effort**: Low · **Priority**: Next · **Theme**: B
- **Persona**: **Maya** sees 2 ghosted applications and wants to send follow-ups; she has to open the tracker and rebuild the filter by hand.

**Recommendation.** The tracker already accepts `?status=` ([`list-query.ts:37`](../../lib/applications/list-query.ts#L37)). Link Interview, Offer, Ghosted, Rejected cards to `/applications?status=<kind>`; "In Progress" needs a multi-status or `active` value added to the list query.

**Acceptance criteria**
- [ ] Every count on the page that maps to a status opens the tracker filtered to those applications.

### `COGN-01` Offers shown three times, interview rate and total twice

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Observed (`1440w.png`): Offers = KPI tile + funnel stage 3 + "Offers Received" card; interview rate = KPI tile + funnel badge; total = KPI tile + funnel badge + funnel stage 1. At 1440×900 the first screen shows the banner, title, filter and KPI strip, and the funnel starts below; at 375px the funnel and outcome cards take about three screens before platforms (`375w.png`).
- **Effort**: Medium · **Priority**: Next · **Theme**: B
- **Location**: [`pipeline-health-hero.tsx:194`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L194), [`kpi-summary-strip.tsx:100`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx#L100)
- **Persona**: **Daniel** scrolls past the same "1 offer" three times before reaching the platform comparison.

**Recommendation.** Keep the KPI strip (with period deltas, see Missing). Replace the funnel cards with one horizontal funnel bar (Applied → Responded → Interview → Offer, with drop-off between stages) and fold Rejected/Ghosted into it as exits. Remove the "Offers Received" card. Compress the filter card into a toolbar row beside the h1.

**Acceptance criteria**
- [ ] Each metric appears once on the page.
- [ ] At 375px the platform section starts within two screen heights of the KPI strip.

### `PERF-01` Page shell waits on `getYears`, then 8 queries each load every matching row

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Code-confirmed. [`overview/page.tsx:157`](../../app/(pages)/analytics/overview/page.tsx#L157) awaits `getYears()` before returning anything, so the filter bar and skeleton cannot stream. The content then runs `getDetailedApplicationBreakdown`, `getStatusPerPlatform` (each: all rows + all history, history awaited after rows, [`analytics.ts:401`](../../app/actions/analytics.ts#L401)), `getWorkModeAnalysis`, `getSalaryInsights`, `getApplicationsPerYear`, `getStasusesPerYear`: 9 round trips, 6 of them full scans of the same rows, aggregated in JS. Cold production TTFB in mock mode was 787 ms vs 311 ms for `/applications`; warm 68 ms (cached). Client JS is not the problem: 668 KB vs 678 KB on `/applications`.
- **Effort**: Medium · **Priority**: Next · **Theme**: A
- **Persona**: **Maya** (1,400 applications) waits on every filter change, since each month/year pair is a new cache key.

**Recommendation.** Move `getYears` inside a Suspense boundary (or pass years from the content). Replace the six readers with one cached loader that selects the needed columns plus history in parallel (`Promise.all`) and computes everything with the Theme A helpers. A single Postgres query can return every count the page needs (sketch, `data-analyst` pass):

```sql
WITH apps AS (
  SELECT a.id, a.platform, a.status_category, a.location, a.date_applied,
         EXISTS (SELECT 1 FROM application_status_history h
                 WHERE h.application_id = a.id
                   AND h.status_category IN ('interview','accepted')) AS reached_interview
  FROM job_applications a
  WHERE a.user_id = $1 AND a.date_applied >= $2 AND a.date_applied < $3
)
SELECT platform,
       count(*)                                   AS total,
       count(*) FILTER (WHERE reached_interview)  AS interviews,
       count(*) FILTER (WHERE status_category = 'accepted') AS offers,
       count(*) FILTER (WHERE status_category = 'ghosted')  AS ghosted
FROM apps GROUP BY ROLLUP (platform);
```

(The JS helper still decides edge cases such as free-text statuses; the query does the counting.) Next 16 marks `unstable_cache` as replaced by `use cache` ([docs](../../node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unstable_cache.md)); migrate when Cache Components are enabled repo-wide.

**Acceptance criteria**
- [ ] Filter bar and skeleton render before any analytics query resolves.
- [ ] One analytics page load issues at most 3 DB queries.

### `SRCH-01` Only calendar month/year filters; a month alone merges every year

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Code-confirmed ([`analytics-filter.tsx:33`](../../app/(pages)/analytics/components/analytics-filter.tsx#L33), [`filter-utils.ts`](../../app/actions/_utils/filter-utils.ts)).
- **Effort**: Medium · **Priority**: Next · **Theme**: B
- **Persona**: **Lior** wants "how did the last 30 days go?". The choices are "October" (which means October of every year) or "October 2026", which on the 3rd of the month is three days of data.

**Recommendation.** Replace the two selects with presets: Last 7 days, Last 30 days, Last 90 days, This year, All time, Custom range (`react-day-picker` is already installed). Filter on `date_applied` instead of the `month`/`year` text columns. Keep `?range=30d` in the URL. Drop the "Filtered View" pill; the selected preset is the indicator.

**Acceptance criteria**
- [ ] "Last 30 days" is one click and survives refresh.
- [ ] Selecting a month without a year is no longer possible.

### `A11Y-11` Section headings nested under the wrong h2

- **Severity**: 🔵 Low (*Cosmetic × Common*)
- **Confidence**: Observed (`inspect-1440.json` headings: h1 Analytics, h2 Application Funnel, h2 Platforms & Sources, h3 Work Model Breakdown, h3 Salary & Compensation, h3 Application Activity).
- **Effort**: ⚡ Quick Win · **Priority**: Next
- **Location**: [`market-reality-matrix.tsx:46`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L46), [`yearly-trends-card.tsx:35`](../../app/(pages)/analytics/components/yearly-trends-card.tsx#L35)
- **Persona**: **Noa** navigating by headings hears Salary and Activity as sub-sections of Platforms.

**Recommendation.** Make the three section titles `h2` (`CardTitle asChild` or a plain `h2`).

**Acceptance criteria**
- [ ] Every top-level section title is an h2.

### `DATA-05` Top-performing source and work-model rates are presented as findings from 3-8 applications

- **Severity**: 🟠 High (*Impedes × Common*): the banner tells the user where to spend effort.
- **Confidence**: Observed (`1440w.png`). 95% Wilson intervals for the rates shown on the demo data (`data-analyst` pass):

  | Shown as | Rate | 95% interval |
  | :--- | :--- | :--- |
  | Greenhouse, "top-performing source" | 3/5 = 60% | 23% - 88% |
  | LinkedIn | 1/4 = 25% | 5% - 70% |
  | Indeed | 1/3 = 33% | 6% - 79% |
  | Hybrid | 2/3 = 67% | 21% - 94% |
  | On-site | 1/7 = 14% | 3% - 51% |

  Every interval overlaps every other. Telling a 20% interview rate from a 10% one with normal confidence takes about 200 applications per group. The platform table at least marks N < 3 as "(early)"; the work model has no sample rule at all and prints "66.7% interview rate" for 3 applications.
- **Effort**: Low · **Priority**: Now · **Theme**: A
- **Location**: [`channel-performance-matrix.tsx:124`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L124), [`:257`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L257), [`market-reality-matrix.tsx:80`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L80)
- **Persona**: **Lior** reads "Greenhouse is your top-performing source" after 18 applications and stops applying through LinkedIn, which may be just as good.

**Problem.** Decimal precision ("60.0%") and the word "top-performing" signal certainty the data doesn't have. With the 2-5% interview rates typical in 2026, most users will see zero or one interview per platform for weeks, so this banner will mostly be driven by chance.

**Recommendation.**
1. One helper `rateWithInterval(k, n)` used by every rate on the page.
2. Name a "top source" only when its lower bound beats the next platform's upper bound; otherwise say "Not enough data to rank platforms yet (need about 20 applications per platform)".
3. Show counts first and rates as whole percentages ("3 of 5 · 60%"); grey out rates for N < 10 with the same "(early)" treatment on platforms and work models.
4. Rank by count of interviews when samples are small; offer rate sorting once N is large enough.

**Acceptance criteria**
- [ ] No banner or label claims a "top" or "best" item unless the intervals separate.
- [ ] Work-model and platform rows use the same small-sample rule and display.

### `A11Y-12` Activity chart and view toggle are not exposed to screen readers

- **Severity**: 🟠 High (*Impedes × Common*): the monthly trend exists only in the chart.
- **Confidence**: Observed (Playwright accessibility tree and keyboard test):
  - The chart SVG is `role="application"` with `tabindex="0"` and **no accessible name**; its tree content is only the axis ticks ("Jan Feb ... 0 3 6 9 12"). Arrow keys move the tooltip (it reached "Mar"), but the tooltip is not a live region, so nothing is announced. There is no table alternative (WCAG 1.1.1, 1.3.1).
  - "By Status" / "Total Volume" are plain buttons with no `aria-pressed` or tab semantics; the selected one differs only by background (WCAG 4.1.2).
  - Each funnel stage is a set of `div`/`span`s, read as one string: "1. Applied 100% of total 18 100% baseline submissions ... ↳ 44.4% yield (8 of 18 applied) ...", including the "↳" glyph. KPI tiles expose label and value as loose text with no pairing.
- **Effort**: Low · **Priority**: Now · **Theme**: C
- **Location**: [`total-applications-per-year-bar-chart.tsx:138`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L138), [`:194`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L194), [`pipeline-health-hero.tsx:144`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L144), [`kpi-summary-strip.tsx:36`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx#L36)
- **Persona**: **Noa** tabs into the chart, hears "application", presses arrows and hears nothing; the funnel is one long sentence with numbers in an unclear order.

**Recommendation.**
- Give the chart `role="img"` and an `aria-label` summary ("Applications per month in 2026: 1 in August, 5 in September, 12 in October"), and render the same data as an `sr-only` `<table>` (month × status), with a visible "Show as table" toggle for everyone.
- Make the view switch a `role="radiogroup"` / `aria-pressed` pair, or use the existing `Tabs` pattern.
- Render KPI tiles and funnel stages as `<dl>` (term = label, definition = value + caption) or an ordered list for the funnel; mark the "↳" glyph `aria-hidden`.

**Acceptance criteria**
- [ ] A screen reader can read every monthly value without hovering.
- [ ] The selected chart view is announced ("By Status, selected").
- [ ] Each funnel stage is announced as "Interview: 8, 44% of applications".

### `COPY-04` One concept has several names

- **Severity**: 🟡 Medium (*Slows × Core*)
- **Confidence**: Code-confirmed (`ux-copy` term inventory of the analytics components):

  | Concept | Names used |
  | :--- | :--- |
  | Where you applied | "Platform" (section title, badge, search, buttons), "Channel" (table header), "source" (banner) |
  | Offer status | "Offer" (chart legend, funnel), "Accepted / Offer" (platform bar legend) |
  | Interview reached | "interview rate", "yield", "led to interviews", "interviewed", "reached recruiter or team rounds" |
  | Applications | "Applications logged", "submitted", "baseline submissions", "Total Applied" |
  | Work model | "On-Site" (description) vs "On-site" (row) |
  | Period | "timeframe" (empty states) vs "Month/Year" (filter) |

  Casing is mixed: Title Case in "No Application Data for This Timeframe", "Add Your First Application", "Show All 6 Platforms (1 More)", "Filter Analytics", sentence case in captions and descriptions.
- **Effort**: ⚡ Quick Win · **Priority**: Now
- **Location**: [`channel-performance-matrix.tsx:398`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L398), [`:261`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L261), [`market-reality-matrix.tsx:50`](../../app/(pages)/analytics/components/market-reality-matrix.tsx#L50), [`pipeline-health-hero.tsx:55`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L55)
- **Persona**: **Lior** wonders whether "Channel" and "Platform" are different groupings, and whether "yield" is a different metric from "interview rate".

**Recommendation.** One term per concept, matching the tracker's own column names: **Platform**, **Offer**, **Interview rate** ("reached interview"), **Applications**, **On-site**, **Period**. Pick one casing rule for headings and buttons and apply it across the app (the Vercel guidelines the repo ships prefer Title Case; the Applications page currently uses sentence case for most labels, so match that).

**Acceptance criteria**
- [ ] Each concept above uses one term everywhere on the page.
- [ ] Headings and buttons follow one casing rule.

### `PLAT-02` Tablet: platform table headers overlap and funnel headers wrap word by word

- **Severity**: 🟡 Medium (*Slows × Common*)
- **Confidence**: Observed (`768w.png`). At 768px the six-column table is shown (`md:block`) in about 860px of content width: "Response Rate" runs into "Pipeline Distribution", and the pipeline legend stacks to four lines per row. The funnel stage headers wrap to "1. / Applied" and "100% of / total", and the "44.4% yield" badge wraps to two lines. KPI captions truncate ("From applied to recruiter respon...").
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: C
- **Location**: [`channel-performance-matrix.tsx:393`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L393), [`pipeline-health-hero.tsx:143`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L143)
- **Persona**: **Daniel** on an iPad in portrait sees overlapping column titles and can't tell which number is which.

**Recommendation.** Switch the cards/table breakpoint from `md` to `lg` (`md:hidden` → `lg:hidden`, `hidden md:block` → `hidden lg:block`) and the funnel grid from `md:grid-cols-3` to `lg:grid-cols-3`; drop the "% of total" label to its own line.

**Acceptance criteria**
- [ ] No overlapping or word-by-word wrapped labels at 768 and 1024px.

### `PERF-02` Guest banner is inserted after hydration and shifts the page

- **Severity**: 🟡 Medium (*Slows × Common*): every guest who has not dismissed the banner sees the page jump.
- **Confidence**: Observed. Layout Shift API on `/analytics/overview`: CLS **0.137** at 375px (above the 0.1 "good" limit) and 0.037 at 1440px. The only shifting node is the analytics column, pushed down 142px (375) / 74px (1440) about 1.5 s after load. Cause: the server snapshot of `useSyncExternalStore` returns "dismissed", so the banner is absent from the HTML and inserted once the client reads `localStorage`.
- **Effort**: Low · **Priority**: Next
- **Location**: [`app/_components/guest-notice.tsx:48`](../../app/_components/guest-notice.tsx#L48), rendered by [`app/(pages)/layout.tsx:16`](../../app/(pages)/layout.tsx#L16) (also affects Applications, ATS and Documents for guests)
- **Persona**: **Daniel** starts reading the KPI strip and it jumps down a screen-third as the notice appears; a tap aimed at a filter can land on the banner.

**Problem.** Unexpected movement breaks reading and causes mis-taps; CLS is a Core Web Vital that the app already reports through `@vercel/speed-insights`.

**Recommendation.** Store dismissal in a cookie as well and read it in the server layout, so the banner is rendered (or omitted) in the HTML; or render the notice as a fixed bottom toast that doesn't move content.

**Acceptance criteria**
- [ ] CLS ≤ 0.05 at 375px for a guest who has not dismissed the notice.

### `PERS-01` Platform table sort, search and expansion, and the chart view mode, reset on refresh (Regressed)

- **Severity**: 🔵 Low (*Slows × Edge*)
- **Confidence**: Code-confirmed. `sortField`, `sortDirection`, `isExpanded`, `searchQuery` ([`channel-performance-matrix.tsx:83`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L83)) and the chart's `viewMode` and `userSelectedYear` ([`total-applications-per-year-bar-chart.tsx:108`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L108)) are `useState`. The page filter already uses `nuqs`.
- **Effort**: Low · **Priority**: Later · **Theme**: B
- **First flagged**: 2026-10-12 (resolved on the old Platform ROI dashboard; came back with the rebuild)
- **Persona**: **Maya** sorts platforms by interview rate, opens one in the tracker, presses Back, and the table is back to volume order and collapsed to 5 rows.

**Recommendation.** Move these into the same `useQueryStates` call as the filter (`?psort=interviewRate&pdir=desc&pall=1&view=total`), with `history: "replace"` so they don't flood Back.

**Acceptance criteria**
- [ ] Sort, expansion and chart view survive refresh and Back.

---

## Redundant

Things that can be removed or merged without losing information.

| Item | Where | Why remove |
| :--- | :--- | :--- |
| "Offers Received" card | [`pipeline-health-hero.tsx:197`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L197) | Same number and percentage as funnel stage 3 and the KPI tile (`COGN-01`). |
| "18 Total Applications" badge and "1. Applied" stage | [`pipeline-health-hero.tsx:121`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx#L121) | Repeats "Total Applied". |
| "Filter Analytics" card title and "Filtered View" pill | [`analytics-filter.tsx:71`](../../app/(pages)/analytics/components/analytics-filter.tsx#L71), [`tabs.tsx:23`](../../app/_components/tabs.tsx#L23) | The selects and Reset already say this; the card takes a full row. |
| Unused server functions | `getDomainLeaderboard`, `getTop5Statuses`, `getGhostedApplications`, `getFunnelBottleneckInsight`, `getBestPlatformInsight` in [`analytics.ts`](../../app/actions/analytics.ts); `getPlatformRoi`, `getBlackHoleBreakdown`, `getRoleTargetingAnalysis` in [`insights/actions.ts`](../../app/(pages)/analytics/insights/actions.ts) | No page calls them; only the mock store and `scripts/verify-all-flows.ts` do. About 600 lines plus their mock copies, still exported from a `"use server"` module, so each is a callable server action. |
| Unused computed fields and props | `resumeConversion`, `responseConversion` (computed, never shown); `averageResponseDays` passed to `PipelineHealthHero` but unused; `Briefcase` import in `kpi-summary-strip.tsx` | Dead code. |
| Analytics logic in the mock store | [`mock-store.ts:482-790`](../../lib/mock-data/mock-store.ts#L482) | A second implementation of every metric; mock mode (used for demos and e2e) can show different numbers from production. |
| Stale revalidation | `revalidatePath("/analytics/insights")` in [`applications.ts:107`](../../app/actions/applications.ts#L107) | Route is a redirect now; the cache tag already covers it. |
| `insights/` folder holding data code | [`app/(pages)/analytics/insights/actions.ts`](../../app/(pages)/analytics/insights/actions.ts) | A redirect-only route folder holds the live work-model and salary queries; move them to `app/actions/analytics.ts`. |
| `"use client"` on static components | `KpiSummaryStrip`, `PipelineHealthHero`, `MarketRealityMatrix`, `YearlyTrendsCard` | No state or effects; they could be server components and ship less JS. |
| Per-primitive `next/dynamic` for Recharts | [`total-applications-per-year-bar-chart.tsx:6-21`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx#L6) | Five dynamic wrappers inside two more dynamic layers; the browser warns the preloaded Recharts chunk is not used. One dynamic import of the chart component is enough. |
| Two DOMs for the platform list | [`channel-performance-matrix.tsx:300`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L300), [`:393`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx#L393) | Card list and table are both rendered and hidden with CSS. Acceptable at 6 rows; worth noting if "Show all" grows to 60+. |

---

## Missing for 2026/2027

Context: 2026 data puts application-to-interview rates at roughly 2-5% and applications per hire at 200-290, so job seekers send many more applications than a few years ago ([Huntr research](https://huntr.co/research/best-job-boards), [HeroHunt benchmarks](https://www.herohunt.ai/blog/recruiting-funnel-conversion-rates-2026-stage-benchmarks/), [F1Jobs](https://www.f1jobs.io/resources/blog/does-mass-applying-still-work-2026)). Competing trackers lead with pipeline analytics and follow-up automation (Huntr) or resume match scoring (Teal) ([Gitnux](https://gitnux.org/best/job-tracking-software/), [Huntr vs Teal](https://huntr.co/blog/huntr-vs-teal)). With that volume, a tracker's analytics earns its place by telling the user what to do next.

Ordered by value to the user, with what already exists in the repo.

| # | Feature | Why it matters | Builds on |
| :--- | :--- | :--- | :--- |
| 1 | **Period comparison on every KPI** (vs previous 30 days, arrow and delta) | "Am I improving?" is the first question; today every number is absolute. | KPI strip, `SRCH-01` ranges |
| 2 | **Weekly activity and goal** (applications this week vs a target the user sets, streak) | High-volume searching needs a pace; weekly goals are the most common coaching advice. | `date_applied`; a settings field |
| 3 | **Needs action list** (applied 7-14 days ago with no reply, interviews with no update in 7 days, ghosting soon) | Turns the dashboard into a to-do list. FUTURE_PLAN.md already lists follow-up reminders as the main gap. | `syncGhostedApplications` threshold, status history |
| 4 | **Time in stage and drop-off** (median days applied → response → interview → offer, and where most applications stop) | Shows whether the problem is the resume (no responses) or interviewing (no offers). | Status history timestamps |
| 5 | **Resume version vs outcome** (interview rate per resume, ATS score vs response) | The app already stores `resumeId` and has an ATS checker; no other section uses them. | `jobApplications.resumeId`, ATS checker |
| 6 | **Benchmarks in context** ("44% reached interview; typical is 2-5%"), with small-sample warnings | Without a reference the user cannot tell if 44% is good or if 3% is bad. | Source the figure and date it |
| 7 | **Role and seniority breakdown** (interview rate by role family or title keyword) | Answers "should I aim lower/higher?". A `getRoleTargetingAnalysis` function exists but is unused. | `role_name` |
| 8 | **Source quality incl. referrals and direct outreach** | Referrals convert far better than job boards; the platform list treats "Company Website" and "Referral" like any board. | `platform` values |
| 9 | **Structured salary** (currency, period, min/max) | Needed for `TRUST-06` and for comparing offers. | AI extraction already reads postings |
| 10 | **Export and share** (CSV of the filtered data, PNG of the funnel, weekly summary email) | Career coaches and bootcamps ask for progress reports; FEATURES.md lists export. | Account export in `lib/account-data.ts` |
| 11 | **AI weekly summary** (3 sentences: what changed, what is stuck, one suggestion) | Uses the existing Gemini integration and daily quota (`lib/ai-quota.ts`); keep it optional and grounded in the numbers shown. | `lib/gemini.ts`, `ai_usage` |

---

## To Verify

| Suspected issue | Why it is uncertain | How to confirm |
| :--- | :--- | :--- |
| Activity chart appears late or empty on first paint | Bars were missing in the full-page capture after 3 s but present after scrolling into view; may be Recharts' entry animation plus lazy chunk loading. | Record a trace on a throttled 4G profile and check when bars first paint. |
| Query cost at real account sizes | Mock mode has 18 rows; Neon latency and row counts were not measured. | Time `/analytics/overview` on a staging account with ~1,400 applications, cold cache. |
| `npm ci` fails: `package-lock.json` is out of sync with `package.json` (missing `esbuild@0.28.2`) | Not part of the page, but a clean install in CI or Vercel would fail. Seen in this run. | Run `npm ci` on main; regenerate the lockfile with `npm install` if it fails. |
| Monthly chart undercounts when a month is stored as both "1" and "01" | Found by `code-review`: the SQL groups by the raw `month` text and `formatApplicationsPerYear` / `transformApplicationsData` overwrite instead of add. Current writes use `format(date, "M")`, but `buildMonthCondition` exists to match "01", which suggests older rows have it. Mock data has none. | `SELECT month, count(*) FROM job_applications GROUP BY month` on production; if "01"-style values exist, sum in the helpers or filter on `date_applied`. |

---

## Coverage

| Category | Status | Findings |
| :--- | :--- | :--- |
| `HIER` Visual hierarchy | Evaluated | (see `COGN-01`) |
| `TYPO` Typography | Evaluated | `TYPO-02` |
| `COLOR` Color & contrast | Evaluated (`contrast.js`, axe) | `COLOR-06` |
| `DSYS` Design system | Evaluated (`token_inventory.js`: 54 arbitrary values, 5 raw palette families) | (see `COLOR-06`, `TYPO-02`) |
| `MOTION` Motion | Evaluated; only skeleton pulse and chart entry; both stop under reduced motion | None |
| `COPY` Content | Evaluated (`ux-copy` term inventory) | `COPY-03`, `COPY-04` |
| `STATE` States | Evaluated: ideal, filtered-empty, loading skeleton, error boundary (source) | `STATE-02` |
| `I18N` Localization | Partial: currency handling covered under `TRUST-06`; no RTL check | `TRUST-06` |
| `NAV` Navigation | Evaluated; breadcrumb and side nav fine | None |
| `AFFORD` Targets | Evaluated: 0 targets fail 2.5.8 at 375px; 20 are below 44px (secondary links) | None |
| `FORM` Forms | N/A: no forms on this page | None |
| `FLOW` Task flow | Evaluated | `FLOW-02` |
| `COGN` Cognitive load | Evaluated | `COGN-01` |
| `SRCH` Filtering & sorting | Evaluated | `SRCH-01`, `A11Y-10` |
| `DATA` Data display | Evaluated (`dataviz` validator and anti-pattern list; `data-analyst` confidence intervals) | `DATA-04`, `DATA-05`, `TRUST-07` |
| `TRUST` Feedback & trust | Evaluated | `TRUST-06`, `TRUST-07` |
| `A11Y` Accessibility | Partial: axe, keyboard walk, accessibility tree, chart keyboard test, 320px reflow, reduced motion; no screen-reader software | `A11Y-10`, `A11Y-11`, `A11Y-12` |
| `PERF` Performance | Evaluated: production build timings, JS weight, query count (mock data only), layout shift | `PERF-01`, `PERF-02` |
| `ETHIC` Dark patterns | Evaluated; none | None |
| `PLAT` Platform | Evaluated at 320/375/768/1440, light and dark | `PLAT-02` |
| `ONBD` First use | Evaluated: zero-data state has a clear CTA | None |
| `PERS` Persistence | Evaluated: filters persist in URL; table and chart view state do not | `PERS-01` (regressed) |

---

## Appendix

### Personas
- **Maya (power user)**: senior engineer, 1,400+ applications over two years across Israel and the US, desktop at 1440px. Wants to know which platforms and work models are worth her time, and compares months.
- **Daniel (mobile)**: checks progress on a phone (375px) between interviews; reads quickly, little patience for scrolling.
- **Noa (keyboard and screen reader)**: uses NVDA and keyboard only; low vision, relies on contrast and heading navigation.
- **Lior (career switcher)**: 3 months into a first tech search, 60 applications, unsure what "good" looks like; takes labels literally.

### Walkthrough

| Step | Persona | Question that failed | Finding |
| :--- | :--- | :--- | :--- |
| Read the KPI strip | Lior | Will they connect the number with their goal? ("recruiter response" is really tracker-update lag) | `COPY-03` |
| Compare work models | Maya | Will they see progress / correct result? (definitions differ) | `TRUST-07` |
| Read salary card | Lior, Maya | Will they get a correct result? | `TRUST-06` |
| Choose a time window | Lior | Will they notice the right action? (no "last 30 days") | `SRCH-01` |
| Filter to an empty month | Maya | Will they see what to do next? | `STATE-02` |
| Act on ghosted count | Maya | Is the action available? (no link) | `FLOW-02` |
| Scroll to platforms on phone | Daniel | Is the next section reachable without repetition? | `COGN-01`, `TYPO-02` |
| Sort platform table | Noa | After acting, will they hear progress? | `A11Y-10` |
| Read stacked chart | Noa, Daniel | Can they tell the series apart? | `COLOR-06`, `DATA-04` |
| Read monthly trend with a screen reader | Noa | After acting, will they hear progress? (arrows move a silent tooltip) | `A11Y-12` |
| Decide where to apply next | Lior | Will they get a correct result? ("top-performing" from 5 applications) | `DATA-05` |
| Compare platforms on a tablet | Daniel | Will they notice the right information? (headers overlap) | `PLAT-02` |
| Land on the page as a guest | Daniel | Will they see stable content? (page jumps 142px) | `PERF-02` |
| Return from the tracker with Back | Maya | Will their view be kept? (sort reset) | `PERS-01` |

### Files Reviewed
- [`app/(pages)/analytics/layout.tsx`](../../app/(pages)/analytics/layout.tsx), [`page.tsx`](../../app/(pages)/analytics/page.tsx), [`loading.tsx`](../../app/(pages)/analytics/loading.tsx), [`error.tsx`](../../app/(pages)/analytics/error.tsx)
- [`app/(pages)/analytics/overview/page.tsx`](../../app/(pages)/analytics/overview/page.tsx), [`overview/loading.tsx`](../../app/(pages)/analytics/overview/loading.tsx)
- [`app/(pages)/analytics/insights/page.tsx`](../../app/(pages)/analytics/insights/page.tsx), [`insights/actions.ts`](../../app/(pages)/analytics/insights/actions.ts), [`status-per-platform/page.tsx`](../../app/(pages)/analytics/status-per-platform/page.tsx)
- [`components/analytics-filter.tsx`](../../app/(pages)/analytics/components/analytics-filter.tsx), [`kpi-summary-strip.tsx`](../../app/(pages)/analytics/components/kpi-summary-strip.tsx), [`pipeline-health-hero.tsx`](../../app/(pages)/analytics/components/pipeline-health-hero.tsx), [`channel-performance-matrix.tsx`](../../app/(pages)/analytics/components/channel-performance-matrix.tsx), [`market-reality-matrix.tsx`](../../app/(pages)/analytics/components/market-reality-matrix.tsx), [`yearly-trends-card.tsx`](../../app/(pages)/analytics/components/yearly-trends-card.tsx), [`total-applications-per-year-bar-chart.tsx`](../../app/(pages)/analytics/components/total-applications-per-year-bar-chart.tsx)
- [`app/_components/tabs.tsx`](../../app/_components/tabs.tsx), [`app/_components/guest-notice.tsx`](../../app/_components/guest-notice.tsx), [`app/actions/analytics.ts`](../../app/actions/analytics.ts), [`app/actions/_utils/filter-utils.ts`](../../app/actions/_utils/filter-utils.ts), [`app/actions/_utils/cache-tags.ts`](../../app/actions/_utils/cache-tags.ts), [`app/actions/applications.ts`](../../app/actions/applications.ts) (ghosting sync), [`lib/utils.ts`](../../lib/utils.ts), [`lib/mock-data/mock-store.ts`](../../lib/mock-data/mock-store.ts), [`app/globals.css`](../../app/globals.css), [`app/db/schema.ts`](../../app/db/schema.ts)

### Method & Evidence
- **Skills used**:
  - `ux-audit` (repo-local, v2.2.0): workflow, personas, severity model, ledger, `inspect_page.js`, `contrast.js`, `token_inventory.js`.
  - `dataviz`: `validate_palette.js` on the chart palette (light and dark, adjacent and all pairs) and the anti-pattern list → `COLOR-06`, `DATA-04`.
  - `design:design-critique`: first impression, hierarchy and consistency across 375/768/1440 → `PLAT-02`, `COGN-01`.
  - `design:accessibility-review`: accessibility tree, chart keyboard test, 320px reflow, reduced motion → `A11Y-12`.
  - `design:ux-copy`: term inventory and casing → `COPY-03`, `COPY-04`.
  - `web-design-guidelines` (repo-local; Vercel rules fetched fresh): URL state, ellipsis, `Intl` number formats, icons, `color-scheme` → `PERS-01` regression; the rest passed or is already covered.
  - `ui-ux-pro-max` (repo-local): its `scripts` and `data` entries are broken symlinks (`../../../src/ui-ux-pro-max/...`), so only the rule tables in SKILL.md were used; `content-jumping` led to the layout-shift measurement → `PERF-02`.
  - `data-analyst` (repo-local): Wilson intervals and sample-size estimate → `DATA-05`; single-query aggregation proposal in `PERF-01`.
  - `code-review` (built-in, high): independent correctness pass over the analytics files; confirmed `TRUST-06`, `TRUST-07`, `DATA-04`, `PERF-01` and added the "1"/"01" month case to To Verify.
  - `react-doctor`: analytics flags listed under Performance below.
  - `senior-fullstack` (repo-local): not usable; its `code_quality_analyzer.py` is a template that always returns 0 findings and its references are placeholders.
- **Passes**: Task walkthrough · State inventory · Heuristic sweep (22 categories) · Accessibility (WCAG 2.2 AA) · Visual craft review · Content review · Metric-definition review · Performance review.
- **Token inventory**: 16 files; 9 font sizes, 4 radii, 2 shadows; 54 Tailwind arbitrary values (mostly `text-[10px]`/`text-[11px]`); 5 raw palette families (amber, blue, emerald, rose, slate) alongside semantic tokens; 6 hex literals in the chart.
- **Contrast checks** (`contrast.js`): `#f59e0b`/white 2.14 · `#10b981`/white 2.53 · `#94a3b8`/white 2.56 · `#64748b`/`#94a3b8` 1.85 · `--muted-foreground`/white 4.93 (10px, passes) · axe: "(early)" `#8c93a1`/`#f9fafb` 2.95.
- **Rendered checks**: `inspect_page.js` (Playwright with `/opt/pw-browsers/chromium`, axe-core 4.12) on `http://localhost:3100/analytics/overview` at 375/768/1440 light, 375/1440 dark, 80-stop keyboard walk with focus crops; `?month=1` (empty) and `?month=10`; chart scrolled into view with tooltip; deep links `/applications?platform=Greenhouse` (5 rows) and `?q=Netflix` (1 row). Light mode: 2 axe violations (both "(early)"), 0 at 2.5.8, no horizontal overflow. Dark mode: 0 violations.
- **Second pass**: Playwright `ariaSnapshot` of the KPI, funnel and chart regions and a platform row; chart focus + ArrowRight ×2; 320px reflow (no overflow, `320w.png`); reduced-motion run (no running animations); Layout Instability API at 375 and 1440 after scrolling to the end; `768w.png` reviewed for tablet layout; `validate_palette.js` light/dark, adjacent/all pairs.
- **Performance**: `DEMO_MODE=true next build` then `next start`; `/analytics/overview` cold TTFB 787 ms, DCL 1.1 s, 668 KB JS in 31 files, 790-913 DOM nodes; `/applications` cold TTFB 311 ms, 678 KB JS. Warm: 68 ms vs 51 ms. `react-doctor`: analytics flags are giant component (`channel-performance-matrix.tsx`), sequential awaits (`analytics.ts:401`), pure function inside component (`market-reality-matrix.tsx:25`), default `[]` prop (`total-applications-per-year-bar-chart.tsx:104`).
- **Research**: [Huntr research](https://huntr.co/research/best-job-boards), [HeroHunt 2026 benchmarks](https://www.herohunt.ai/blog/recruiting-funnel-conversion-rates-2026-stage-benchmarks/), [F1Jobs 2026](https://www.f1jobs.io/resources/blog/does-mass-applying-still-work-2026), [Gitnux 2026 job tracking software](https://gitnux.org/best/job-tracking-software/), [Huntr vs Teal](https://huntr.co/blog/huntr-vs-teal). Vendor sources noted as such.
- **Checked & cleared**: "1 Issue" dev overlay and console errors come from the demo Clerk key in mock mode, not this page. Toggle theme and Sign in focus results belong to the app shell (audited 2026-10-14). Keyboard stops on `nextjs-portal` are the dev overlay. Platform and company deep links work. Filter selects have accessible names. `--status-*` tokens resolve correctly (comma HSL syntax is valid). `code-review` claimed "No Response (30+ Days)" misses stale applications because only explicit ghosted statuses count: cleared, because `syncGhostedApplications` marks applied/review applications with no activity for 30 days as ghosted daily (cron) and after every create. All 37 lucide icons are `aria-hidden`; `color-scheme: dark` is set by `next-themes`. Unused server actions are user-scoped through `getCurrentUserIdOrThrow`, so their exposure is a maintenance cost, not a data leak; they are still called by `scripts/verify-all-flows.ts`, which must be updated when they are removed.
- **Not run**: screen-reader software, 200% zoom, a real database or large account.
- **Suppressed**: 0.
