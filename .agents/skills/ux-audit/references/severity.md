# Severity, Confidence & Priority

Every finding is rated on four independent dimensions. Keep them separate: a problem can be severe but cheap to fix, or obvious in code but uncertain in impact.

| Dimension | Question it answers | Values |
| :--- | :--- | :--- |
| **Severity** | How much does this hurt the user? | 🔴 Critical · 🟠 High · 🟡 Medium · 🔵 Low |
| **Confidence** | How sure are we that it's real? | Observed · Code-confirmed · Needs verification |
| **Effort** | How long will the fix take? | ⚡ Quick Win · Low · Medium · High |
| **Priority** | When should the team fix it? | Now · Next · Later (derived from the other three) |

---

## 1. Severity

Severity is derived from two factors. Rate each factor first, then look up the severity. Do **not** rate severity by how easy the issue was to spot, or by how bad the code looks.

### Factor A: Impact on the affected user's task

| Impact | Definition |
| :--- | :--- |
| **Blocks** | The user cannot complete the task, or is harmed: data loss, unintended charge, privacy exposure, legal or safety risk, or a WCAG Level A failure that stops an assistive-technology user. |
| **Impedes** | The task can be completed, but users commonly make errors, backtrack, need help, or abandon. |
| **Slows** | The user hesitates, re-reads, or spends extra effort, but recovers without errors. |
| **Cosmetic** | No measurable effect on the task; it affects polish, consistency, or perceived quality. |

### Factor B: Reach (how often the affected user meets it)

| Reach | Definition |
| :--- | :--- |
| **Core** | On the primary path of the flow. Every user of the affected persona meets it in most sessions. |
| **Common** | On a frequent secondary path, or in a state many users reach (first-use, validation error, slow network). |
| **Edge** | A rare state, an uncommon input, or an infrequent path. |

> Reach is measured **within the affected persona**, not across all users. A keyboard trap on the checkout button is Core for keyboard users, even if they are a minority of traffic. Never discount accessibility blockers because "few users use screen readers".

### Lookup

| Impact ↓ / Reach → | Core | Common | Edge |
| :--- | :---: | :---: | :---: |
| **Blocks** | 🔴 Critical | 🔴 Critical | 🟠 High |
| **Impedes** | 🟠 High | 🟠 High | 🟡 Medium |
| **Slows** | 🟡 Medium | 🟡 Medium | 🔵 Low |
| **Cosmetic** | 🔵 Low | 🔵 Low | 🔵 Low |

**Persistence adjustment:** If an *Impedes* or *Slows* issue only hurts on first encounter and users reliably learn around it, lower it by one level. Never lower *Blocks*.

**Systemic adjustment:** A *Cosmetic* issue that is systemic (it appears on most screens and makes the product look unfinished or untrustworthy) may be raised to 🟡 Medium. State that this is the reason. Perceived quality affects trust and conversion, but only in aggregate.

Write the reasoning on the finding in one line, e.g. `Impedes × Core`.

---

## 2. Confidence

Source-only audits produce false positives. Label every finding honestly, because one wrong finding costs the whole report its credibility.

| Confidence | Use when | Allowed severities |
| :--- | :--- | :--- |
| **Observed** | Seen in the rendered UI, measured by a tool (screenshot, axe-core, computed style, `contrast.js` on resolved values, browser keyboard test). | Any |
| **Code-confirmed** | The source proves it unambiguously, *after* you completed the verification protocol in [false-positives.md](./false-positives.md): you traced the rendered usage, checked parents, global styles, and library defaults. | Any |
| **Needs verification** | Depends on runtime behavior, code you could not see (backend, auth provider, CMS content, feature flags), or a library whose behavior you could not confirm. | Listed separately under **To Verify**. Not counted in severity totals or the scorecard. |

Rule: if you are tempted to write "might", "may", or "possibly" in the problem statement, the confidence is **Needs verification**.

---

## 3. Effort

| Effort | Typical scope |
| :--- | :--- |
| ⚡ **Quick Win** | < 15 minutes. A single class, attribute, or string change. |
| **Low** | 1–2 hours. A small component change, a new empty state, wiring labels and errors. |
| **Medium** | Half a day to 2 days. A new shared primitive, a validation refactor, restructuring one screen. |
| **High** | Multi-day. Flow redesign, IA change, design-system or token overhaul. Usually needs design work before code. |

---

## 4. Priority (derived)

| Priority | Rule |
| :--- | :--- |
| **Now** | Any 🔴 Critical · 🟠 High with Quick Win or Low effort · 🟡 Medium with Quick Win effort |
| **Next** | 🟠 High with Medium or High effort · 🟡 Medium with Low or Medium effort · 🔵 Low with Quick Win effort (batch them as a polish pass) |
| **Later** | 🟡 Medium with High effort · 🔵 Low with Low effort or more |

Findings marked **Needs verification** get no priority until they are verified.

---

## 5. Calibration Examples

Use these as anchors. When a finding feels between two levels, compare it to the closest example.

| # | Finding | Impact × Reach | Severity | Why |
| :--- | :--- | :--- | :--- | :--- |
| 1 | "Delete project" deletes immediately, with no confirmation and no undo | Blocks × Common | 🔴 Critical | Irreversible data loss on a routine action. |
| 2 | Focus outline removed globally (`outline: none`) with no replacement | Blocks × Core | 🔴 Critical | Keyboard users cannot see where they are on any screen. |
| 3 | Icon-only "Send" button has no accessible name | Blocks × Core | 🔴 Critical | Screen-reader users cannot identify the primary action. |
| 4 | "Pay" button gives no pending state and is not disabled while the request runs | Blocks × Common | 🔴 Critical | Double-clicks can double-charge: harm, not just friction. |
| 5 | Signup "Create account" button gives no pending state for 2–4 s | Impedes × Core | 🟠 High | Users re-click or think it froze, but nothing irreversible happens. Compare with #4: same pattern, different harm. |
| 6 | Inputs use placeholder text as the only label | Impedes × Core | 🟠 High | The label disappears on typing; users lose context and errors rise. Widely treated as a failure of WCAG 3.3.2 (Labels or Instructions). |
| 7 | First-time users see a blank table with no guidance or create action | Impedes × Common | 🟠 High | Every new user hits it, at the moment they are most likely to churn. |
| 8 | Form asks for data the persona doesn't have at that moment (e.g. a tax ID during signup) | Impedes × Core | 🟠 High | A direct cause of abandonment. |
| 9 | Generic "Something went wrong" with no retry on a dashboard widget | Impedes × Edge | 🟡 Medium | Real dead end, but only when the request fails. |
| 10 | Product alternates "Workspace", "Team", and "Organization" for the same concept | Slows × Core | 🟡 Medium | Users pause to work out whether these are different things. |
| 11 | Secondary hint text at 2.5:1 contrast | Slows × Core | 🟡 Medium | Fails WCAG 1.4.3, but the task can be completed without the hint. If the low-contrast text carries required information (password rules, prices, errors), it becomes Impedes → 🟠 High. |
| 12 | Mobile secondary action with a 32×32px target | Slows × Common | 🟡 Medium | Meets the WCAG 2.2 AA minimum (24×24) but is below the 44pt / 48dp platform guidance, so mis-taps are likely. Below 24×24 with no spacing exception: fails 2.5.8 → 🟠 High. |
| 13 | Button radius is 6px on one page and 8px on another | Cosmetic × Common | 🔵 Low | Polish. Report under a design-system theme if it is part of a wider pattern. |
| 14 | No keyboard shortcut for a frequent power-user action | Slows × Edge | 🔵 Low | Nice to have unless the persona is explicitly keyboard-first and high-frequency. |

### Not a finding

Do not file these at all:
- A loading state missing on an operation that reliably completes in under ~300 ms.
- Code-quality issues with no user-visible effect (prop drilling, file length, naming).
- Personal taste without a principle behind it ("I'd use a different blue").
- Behavior already handled by a library, a parent component, or a route-level boundary (see [false-positives.md](./false-positives.md)).
- Best-practice suggestions with no plausible effect on the persona's task. Mention them in the strengths/notes section if useful, not as findings.

---

## 6. Common Miscalibrations

- **Inflating detectable issues.** Missing `alt` text on a decorative image is easy to find but is not even a defect when `alt=""` is correct.
- **Deflating judgment issues.** A confusing flow step or a misleading label often costs more than any missing attribute. Rate by user impact, not by how mechanical the evidence is.
- **Treating every WCAG item as Critical.** Rate a WCAG failure by its actual Impact × Reach. A contrast failure on a footer link is not Critical.
- **Treating all destructive actions as Critical.** An action with a working undo is not irreversible.
- **Counting one root cause many times.** If 9 inputs lack labels because they all use one `<AuthInput>` component, that is **one** finding at the component, with the instance count in the evidence.
