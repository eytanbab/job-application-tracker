# UX Audit Report Template

Save the report to `.ux-audit/reports/[YYYY-MM-DD]-[flow-slug].md`. The report has two layers:

1. **Stakeholder layer** (Verdict → Roadmap): readable in 2 minutes by a founder, PM, or design lead who will not read individual findings.
2. **Practitioner layer** (Findings → Appendix): everything a developer or designer needs to fix and verify each issue.

Sections marked *(conditional)* are omitted when empty. Never pad a section to fill it.

---

````markdown
# UX Audit — [Flow Name]

> **Verdict:** [2–3 sentences for a reader who reads nothing else. State the overall quality of the flow, the single biggest risk to users or the business, and the most valuable next move. Plain language, no category codes, no hedging.]

| | |
| :--- | :--- |
| **Date** | [YYYY-MM-DD] |
| **Scope** | [Flow name]: [N] steps/screens, [N] files ([details](#files-reviewed)) |
| **Mode** | [Source-only · Interactive · Design Review] |
| **Personas** | [Persona 1], [Persona 2] ([details](#personas)) |
| **Previous audit** | [YYYY-MM-DD, or "None"] |

---

## Scorecard

| Dimension | Score | Rationale |
| :--- | :---: | :--- |
| Visual design & craft | [1–5 or —] | [One line, grounded in findings or strengths] |
| Content & clarity | [1–5 or —] | [...] |
| Interaction & flow | [1–5 or —] | [...] |
| Feedback & trust | [1–5 or —] | [...] |
| Accessibility | [1–5 or —] | [...] |
| Platform fit | [1–5 or —] | [...] |

*1 Broken · 2 Poor · 3 Adequate · 4 Good · 5 Excellent · — Not evaluable in this mode. Scores follow the rubric, so they can be compared across audits.*

---

## What's Working

- **[Specific strength]**: [Concrete evidence with a file link or screenshot reference.] [Why it matters, and what to protect when fixing other issues.]
- [2–4 items. Each must be specific to this product. Never generic praise like "clean design".]

---

## Top Priorities

1. **[Outcome-oriented title, e.g. "Let invited staff finish signup without information they don't have"]**: [Why this matters to the persona and to the business.] Resolves [`[CAT-XX]`](#cat-xx-title). Effort: [Low].
2. ...
3. ...

---

## Themes

*(conditional: include when two or more findings share a root cause)*

### Theme A: [Root-cause name, e.g. "Errors are handled ad hoc, not by a shared pattern"]
[2–3 sentences diagnosing the underlying decision or missing system, not restating the symptoms.]
- **Findings**: `[CAT-XX]`, `[CAT-YY]`, `[CAT-ZZ]`
- **Systemic fix**: [The single change that resolves most of them, e.g. "Create one `<Field>` primitive that owns label, hint, error, and ARIA wiring."]

---

## Roadmap

| Now | Next | Later |
| :--- | :--- | :--- |
| `[CAT-XX]` [short title] | `[CAT-YY]` [short title] | `[CAT-ZZ]` [short title] |

**At a glance:** 🔴 [N] Critical · 🟠 [N] High · 🟡 [N] Medium · 🔵 [N] Low · ⚡ [N] Quick Wins · [N] to verify

---

## Resolved Since Last Audit

*(conditional: only if a prior audit of this flow exists)*

- **`[CAT-XX]` [Issue title]**: verified resolved in [`path/to/file.tsx`](../../path/to/file.tsx).

---

## Findings

Ordered by priority (Now → Next → Later), then severity. IDs come from the findings ledger and never change. Recurring findings show **First flagged**; findings that came back after being resolved are marked **Regressed** in the title line.

| ID | Finding | Severity | Confidence | Effort | Priority | Theme |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `[CAT-XX]` | [Title] | 🟠 High | Code-confirmed | ⚡ Quick Win | Now | A |

### `[CAT-XX]` [Concise, specific title stating the problem]

- **Severity**: 🟠 High (*Impedes × Core*)
- **Confidence**: Code-confirmed. [The evidence, e.g. "`AuthInput` renders no `<label>`; the placeholder is the only text label, used by all 6 fields."]
- **Effort**: ⚡ Quick Win · **Priority**: Now · **Theme**: A
- **First flagged**: [YYYY-MM-DD] *(recurring and regressed findings only)*
- **Location**: [`src/components/Example.tsx:42`](../../src/components/Example.tsx#L42) *(or screenshot: `375w.png`, hero section)*
- **Persona**: **[Persona name]**: [What happens to this person, in their context, step by step.]

**Problem.** [What is wrong and why it matters, for the user first and then the business. Name the principle or WCAG criterion it breaks.]

**Recommendation.** [The design intent in one or two sentences, then the most useful concrete form:]

- *Code change*:
  ```diff
  - <current code>
  + <fixed code>
  ```
- *Copy rewrite*:
  | Where | Current | Proposed |
  | :--- | :--- | :--- |
  | [Element] | "Invalid input" | "Enter an email like name@clinic.com" |
- *Design spec* (flow, layout, or IA changes where a diff would be fake precision): numbered changes, an ASCII wireframe, or a before/after step list.

**Acceptance criteria**
- [ ] [Observable, testable condition that proves the fix, e.g. "Every field shows a visible label while typing."]
- [ ] [e.g. "Screen reader announces the field name and error message when focus enters an invalid field."]

---

## To Verify

*(conditional: findings with Confidence = Needs verification. Not counted in totals or scores.)*

| Suspected issue | Why it is uncertain | How to confirm |
| :--- | :--- | :--- |
| [Description] | [e.g. "Session timeout is configured in the auth provider, not this repo"] | [e.g. "Leave signup idle 30 min, then submit"] |

---

## Coverage

| Category | Status | Findings |
| :--- | :--- | :--- |
| `HIER` Visual hierarchy | Evaluated | — |
| `COLOR` Color & contrast | Evaluated | `[COLOR-01]` |
| `A11Y` Accessibility | Partial: screen-reader announcements need a rendered check | `[A11Y-01]` |
| `SRCH` Search & filtering | N/A: flow has no search | — |
| ... | ... | ... |

*Status: Evaluated · Partial (state what could not be checked) · N/A (state why) · Not evaluable in this mode (state why).*

---

## Appendix

### Personas
- **[Persona name]**: [Role, goal in this flow, context and constraints, device, technical comfort, relevant abilities or limitations.]

### Walkthrough

*(Deep audits: one row per step where a walkthrough question failed for at least one persona.)*

| Step | Persona | Question that failed | Finding |
| :--- | :--- | :--- | :--- |
| 3. Enter clinic details | Front-desk Rachel | Will they try to do the right thing? (doesn't have the NPI) | `[FLOW-01]` |

### Files Reviewed
- [`path/to/Component.tsx`](../../path/to/Component.tsx)

### Method & Evidence
- **Passes**: [Task walkthrough · State inventory · Heuristic sweep (22 categories) · Accessibility (WCAG 2.2 AA) · Visual craft review · Content review]
- **Token inventory**: [Key numbers from `token_inventory.js`, e.g. "4 distinct radii, 2 neutral palettes (gray, slate), 3 arbitrary values"]
- **Contrast checks**: [Pairs computed with `contrast.js` and their ratios]
- **Rendered checks** *(Interactive mode)*: [URL, widths, emulation, axe-core results summary, keyboard walk summary, checks that could not run]
- **Checked & cleared**: [Suspected issues ruled out during verification, with the reason, e.g. "Terms dialog focus trap: provided by Radix Dialog."]
- **Suppressed**: [Ledger entries marked won't-fix or false-positive that were not reported, e.g. "2 (`DSYS-02` won't fix: legacy screen)"]
````

---

<!-- AGENT INSTRUCTIONS ONLY: Do not include the section below in generated audit reports -->

## Agent Authoring Directives

### Writing the stakeholder layer
1. **Write the verdict last**, after all findings are rated. It must be consistent with the scorecard and the top priorities.
2. **Top priorities are outcomes, not tickets.** Title them by what changes for the user ("Let invited staff finish signup…"), not by the defect ("Missing field").
3. **Themes diagnose causes.** "Several inputs lack labels" is a symptom. "There is no shared field primitive, so every form re-implements labels and errors" is a theme. A theme needs at least two findings.
4. **Strengths are evidence-based.** Cite where they are. They tell the team what not to break while fixing the rest.

### Scorecard rubric

Map categories to dimensions:

| Dimension | Categories |
| :--- | :--- |
| Visual design & craft | `HIER`, `TYPO`, `COLOR` (non-a11y aspects), `DSYS`, `MOTION` |
| Content & clarity | `COPY`, `STATE`, `I18N` |
| Interaction & flow | `NAV`, `AFFORD`, `FORM`, `FLOW`, `COGN`, `SRCH`, `DATA` |
| Feedback & trust | `TRUST`, `PERF`, `ETHIC` |
| Accessibility | `A11Y`, plus any WCAG failure filed under another category |
| Platform fit | `PLAT`, `ONBD`, `PERS` |

Score each dimension from its open findings (Needs-verification items excluded):

| Score | Rule |
| :---: | :--- |
| **1** Broken | At least one 🔴 Critical with Core reach. |
| **2** Poor | Any other 🔴 Critical, or three or more 🟠 High. |
| **3** Adequate | One or two 🟠 High, or four or more 🟡 Medium. |
| **4** Good | Only 🟡 Medium (fewer than four) and 🔵 Low. |
| **5** Excellent | Only 🔵 Low, and the strengths show deliberate craft. |
| **—** | Not evaluable in this mode (e.g. Accessibility in Design Review mode is limited to visual checks). |

### Findings
1. **IDs**: `[CAT-XX]` using codes from [categories.md](./categories.md). Recurring findings keep their original ID.
2. **Links**: Relative to the report's location (`.ux-audit/reports/`), so `../../src/...#L42`. Never use `file:///` or absolute paths.
3. **One root cause, one finding.** If one shared component causes the issue everywhere, file it once at the component and list the instance count.
4. **Choose the recommendation format that fits.** A diff for code-level fixes; a copy table for wording; a design spec for flow, layout, or IA changes. Never force a diff onto a design decision.
5. **Diffs must fix the stated problem completely** (e.g. a "missing required indicator" fix must update both the visual indicator and the input's `required`/`aria-required`).
6. **Acceptance criteria must be observable** by someone using the UI or a test, not "code is cleaner".
7. **Consistency check before saving**: counts in the roadmap and at-a-glance line match the findings; every finding appears in the roadmap; every ID in a theme exists; scores match the rubric.
