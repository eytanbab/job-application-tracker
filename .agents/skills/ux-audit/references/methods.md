# Audit Methods

A professional audit is not one pass over a checklist. Each pass below looks at the flow through a different lens and finds problems the others miss. Run all six in Deep audits. Every candidate finding then goes through verification and rating (SKILL.md Step 5).

| Pass | Lens | Finds what others miss |
| :--- | :--- | :--- |
| 1. Task walkthrough | The persona, step by step | Steps where the user doesn't know what to do or doesn't have what's needed |
| 2. State inventory | Every state each screen can be in | Missing empty, error, and edge states nobody designed |
| 3. Heuristic sweep | The categories in [categories.md](./categories.md) | Breadth: nothing gets skipped |
| 4. Accessibility conformance | WCAG 2.2 AA | Barriers for keyboard, screen-reader, low-vision, and motor-impaired users |
| 5. Visual craft review | A senior visual designer's eye | Inconsistency, weak hierarchy, unpolished or generic look |
| 6. Content review | Every user-facing string | Vague actions, inconsistent terms, unhelpful errors |

---

## Pass 1: Task Walkthrough

Based on the cognitive walkthrough method. This is where personas produce findings instead of decorating them.

1. **Define the task** for each persona: their goal in this flow, where they arrive from (invite email, search, nav menu, notification), and what success looks like.
2. **List the steps**: each screen, decision, and action, in order, from the routing and component tree (or the screenshots).
3. **At each step, ask four questions as that persona:**
   1. **Will they try to do the right thing?** Do they understand what this step needs, and do they *have* it (information, permission, time)?
   2. **Will they notice the right action is available?** Is it visible, above the fold where it matters, and the most prominent thing on the screen?
   3. **Will they connect the action with their goal?** Does the label use their words, not the system's?
   4. **After acting, will they see progress?** Is there immediate, clear feedback that it worked, or what went wrong?
4. **Apply the persona's constraints** at every step: interruptions, device and viewport, time pressure, abilities, technical comfort.
5. Every "no" is a candidate finding. Note the step and question; they make the **Persona** field of the finding concrete.

Record the walkthrough compactly in the report appendix (see the template's optional *Walkthrough* table).

---

## Pass 2: State Inventory

For every screen or component that shows data or depends on async work, list which states exist in the code (or screenshots):

| State | Variants to look for |
| :--- | :--- |
| **Ideal** | Typical data, everything working |
| **Empty** | First use (nothing created yet) · no results for a search or filter · cleared by the user |
| **Loading** | Initial load · refresh · pagination or infinite scroll · action in progress (button pending) |
| **Partial** | Some sections loaded, others failed · stale data shown while refreshing |
| **Error** | Validation · network or offline · server error · permission denied · not found · session expired |
| **Success** | Confirmation after an action · what happens next |
| **Edge content** | Very long names and text · 0, 1, and very many items · missing images or avatars · large numbers and currencies · unusual names (apostrophes, non-Latin scripts) |
| **Role and permission** | Read-only users, disabled features, plan limits (upgrade prompts) |

Mark each state **Designed** (handled deliberately), **Default** (falls through to a blank area, raw error, or broken layout), or **Missing**. A Default or Missing state on a Core or Common path is a `STATE` finding. First-use empty states are often the most valuable finding in a product, because every new user sees them.

---

## Pass 3: Heuristic Sweep

Sweep every in-scope file against every applicable category in [categories.md](./categories.md). This pass provides breadth. Use the Coverage table in the report to show honestly what was evaluated.

---

## Pass 4: Accessibility Conformance (WCAG 2.2 AA)

Check the criteria below. Most can be checked from source; criteria marked ◐ need the rendered page (Interactive mode) for an **Observed** rating.

| SC | Criterion | What to check |
| :--- | :--- | :--- |
| 1.1.1 | Non-text content | Informative images have meaningful `alt`; icon-only controls have names; decorative images use `alt=""` |
| 1.3.1 | Info & relationships | Real labels, headings, lists, table headers, and fieldsets for grouped controls |
| 1.3.5 | Input purpose | `autocomplete` on personal-data fields |
| 1.4.1 | Use of color | Errors, required fields, and states are not shown by color alone |
| 1.4.3 | Contrast (text) | 4.5:1 normal, 3:1 large, computed with `contrast.js` |
| 1.4.4 ◐ | Resize text | Usable at 200% zoom |
| 1.4.10 ◐ | Reflow | No sideways scrolling at 320px wide |
| 1.4.11 | Non-text contrast | Input borders, focus indicators, and meaningful icons at 3:1 |
| 1.4.12 ◐ | Text spacing | No clipping when line height and letter spacing are increased; avoid fixed heights on text containers |
| 1.4.13 | Content on hover/focus | Tooltips and popovers can be dismissed, hovered, and stay visible |
| 2.1.1 | Keyboard | Everything works by keyboard: no `div` click handlers without key handling and focusability |
| 2.1.2 | No keyboard trap | Focus can always leave components (except modals, which must close with Escape) |
| 2.2.1 | Timing adjustable | Session timeouts warn and can be extended |
| 2.2.2 | Pause, stop, hide | Auto-moving content lasting over 5 s (carousels, infinite animations) can be paused |
| 2.4.1 | Bypass blocks | Skip link or landmarks |
| 2.4.2 | Page titled | Unique, descriptive `<title>` per route |
| 2.4.3 ◐ | Focus order | Tab order follows the visual order; no positive `tabindex` |
| 2.4.4 | Link purpose | No bare "Click here" or "Learn more" without context |
| 2.4.6 | Headings & labels | Headings and labels describe their purpose |
| 2.4.7 ◐ | Focus visible | No `outline: none` without a visible replacement |
| 2.4.11 ◐ | Focus not obscured | Sticky headers, footers, and banners don't cover the focused element |
| 2.5.3 | Label in name | The visible label text is included in the accessible name |
| 2.5.7 | Dragging movements | Every drag action has a single-pointer alternative (buttons, menus) |
| 2.5.8 ◐ | Target size | 24×24 CSS px minimum, or adequate spacing |
| 3.1.1 | Language of page | `lang` on `<html>` |
| 3.2.2 | On input | Changing a field doesn't unexpectedly submit or navigate |
| 3.3.1 | Error identification | Errors identify the field and describe the problem in text |
| 3.3.2 | Labels or instructions | Visible labels; format hints before input |
| 3.3.3 | Error suggestion | Errors say how to fix it |
| 3.3.4 | Error prevention | Legal, financial, or data-deleting submissions can be reviewed, corrected, or reversed |
| 3.3.7 | Redundant entry | Information already given in the flow isn't asked for again |
| 3.3.8 | Accessible authentication | No cognitive tests to sign in; paste and password managers allowed |
| 4.1.2 | Name, role, value | Custom controls expose role, name, and state (`aria-expanded`, `aria-checked`, ...) |
| 4.1.3 | Status messages | Async results, errors, and toasts are announced (`role="status"`/`"alert"`, `aria-live`) |

---

## Pass 5: Visual Craft Review

This is the pass that separates a design lead's audit from a linter. Start from `token_inventory.js` output and the fold screenshots (if any), then review:

- **Hierarchy**: Squint at the screen (or imagine it blurred). Is there one clear focal point? Can the persona find the primary action within about 3 seconds on the first screen?
- **Spacing rhythm**: Spacing follows a consistent scale (usually multiples of 4 or 8 px). Related items sit closer together than unrelated ones. Card and section padding is consistent.
- **Alignment**: Elements share edges. Look for near-misses (2–3 px offsets), which look like mistakes, and for icons that aren't optically centered with their text.
- **Typography**: A small number of size steps with clear jumps between them. Weight is used for hierarchy, not decoration. Comfortable line length. Tabular figures for numbers in tables.
- **Color**: One accent color carries interactive meaning. Semantic colors (red, green, amber) are used only for their meaning. One neutral palette.
- **Iconography**: One icon family, with consistent size, stroke weight, and fill style.
- **Density**: Matches the persona. Power users want density and scannability; first-time users need space and guidance.
- **Polish**: Consistent radii and elevation. Every interactive element has hover, active, focus, and disabled states. Truncated text has an ellipsis and a way to see the full text. Images keep their aspect ratio. No layout shift when content loads.
- **Generic or template look**: Watch for signs that a UI was assembled from defaults rather than designed:
  - component-library defaults with no brand expression;
  - decorative gradients or glass effects that don't support content;
  - emoji used as icons;
  - vague hero copy ("Welcome to our app", "Get started today");
  - sections that look like they come from different templates;
  - placeholder or lorem text.

  These hurt perceived quality and trust. Rate each one *Cosmetic*. If the issue is systemic, apply the systemic adjustment in [severity.md](./severity.md).

Every craft finding needs a named principle and specific evidence (values, locations, screenshot regions). "Looks dated" is not a finding. "Three different button styles on one screen (`rounded-md`, `rounded-[7px]`, `rounded-full`) weaken the visual system" is.

---

## Pass 6: Content Review

1. **Collect** every user-facing string in the flow: components, translation files, validation schemas, toasts, emails or SMS the flow triggers (if they live in the repo), and `<title>`s.
2. **Build a term list**: each concept and the words used for it ("Workspace / Team / Organization"). More than one word for the same concept is a finding.
3. **Check each string**:
   - Actions are specific and start with a verb ("Export CSV", not "Submit").
   - Errors say what happened and how to fix it.
   - Empty states say why the screen is empty and what to do next.
   - The persona's vocabulary is used instead of internal or technical terms.
   - Voice, tone, and capitalization (sentence case vs. title case) are consistent.
   - Numbers, dates, and currencies are formatted for the user's locale.
   - Link text makes sense out of context.
   - Consumer audiences: aim for plain language, short sentences, and common words.
4. **Write the fix**: give rewrites as a *Current → Proposed* table in the finding.
