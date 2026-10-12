# UX/UI Audit Categories & Heuristic Rules

Every audit evaluates in-scope components against the 22 standard categories below from the perspective of each generated persona. Findings must cite the specific Category Code, file location, and affected persona.

The rules below are heuristics, not pass/fail laws. A rule violation becomes a finding only when it has a plausible effect on the persona's task. Rate it with [severity.md](./severity.md), and run the verification protocol in [false-positives.md](./false-positives.md) before filing it as Code-confirmed. Cite the WCAG 2.2 success criterion number for accessibility findings (e.g. `WCAG 1.4.3`).

> [!NOTE]
> **Stack-Agnostic Signals**: Inspection signals below include examples across React/JSX, Vue (`.vue`), Svelte (`.svelte`), Angular (`.ts/.html`), and plain HTML/CSS. Adapt inspection patterns to the project's detected `tech_stack` in `context.json`. For native apps (React Native, Flutter, SwiftUI, Jetpack Compose), use the signals and platform conventions in [native-mobile.md](./native-mobile.md).

---

## Group 1: Visual Design

### `[HIER]` Visual Hierarchy & Layout
- **Rules**:
  - The primary action must have the highest visual prominence (weight, elevation, contrast) on the screen.
  - Related items must be grouped via proximity, cards, borders, or shared background surfaces.
  - Page scan order must follow natural F/Z-patterns matching user task priority.
  - Information density must balance context without overwhelming (no wall-of-text or excessive whitespace).
- **Inspection Signals**:
  - CSS / Tailwind: `display: flex/grid`, `gap`, padding/margin scale, `z-index`, competing primary buttons (`bg-primary`, `btn-primary`, `.primary`).
  - DOM / Templates: Structure of container nesting, semantic separation of `<header>`, `<main>`, `<aside>`, `<footer>`.
- **Anti-Patterns**: Multiple competing primary CTA buttons; duplicate controls performing identical actions; unbalanced whitespace forcing unnecessary pagination/scrolling.

### `[TYPO]` Typography & Readability
- **Rules**:
  - Body copy should be ≥16px (1rem) on web; dense UI text (tables, metadata) can go to 14px, but rarely below 12px. On iOS, follow Dynamic Type (17pt body default); on Android, use `sp` units so text respects the user's font scale.
  - Text inputs on mobile web must be ≥16px, or iOS Safari zooms the page on focus.
  - Line length should remain within 45–75 characters per line (max-w constraints).
  - Line height must provide adequate breathing room (1.4–1.6 for body, 1.1–1.3 for headings).
  - Typographic scale must establish distinct hierarchical levels (h1, h2, h3 vs body).
- **Inspection Signals**:
  - CSS: `font-size`, `line-height`, `letter-spacing`, `max-width: ch / rem`, font weight variance (`font-normal`, `font-semibold`).
- **Anti-Patterns**: Unconstrained full-width text on ultra-wide viewports; cramped line height in multi-line paragraphs; decorative fonts used for data-dense tables.

### `[COLOR]` Color, Contrast & Visual Cues
- **Rules**:
  - Text-to-background contrast must meet WCAG 2.2 AA, SC 1.4.3 (≥4.5:1 normal text; ≥3:1 for large text, meaning ≥24px regular or ≥18.66px bold). Resolve tokens to real values and compute with `scripts/contrast.js`; never estimate by eye.
  - Control boundaries, focus indicators, and meaningful graphics must meet ≥3:1 against adjacent colors (SC 1.4.11).
  - Color must **never** be the sole indicator of state, error, or required status (must pair with icons/text).
- **Inspection Signals**:
  - Hex codes / CSS variables / color tokens; `text-muted-foreground`, `#888`, `#999` on light surfaces.
  - Required form asterisks colored red without `aria-required` or accessible text labels.
- **Anti-Patterns**: Light gray text on white cards; red/green color indicators without accompanying iconography.

### `[DSYS]` Visual Consistency & Design System Adherence
- **Rules**:
  - Interactive elements (buttons, inputs, badges, modals) must follow consistent corner radiuses, elevation shadows, and padding scales.
  - Iconography must adhere to a single visual style (line weight, stroke vs. fill, icon grid size).
  - *(Conditional: Theming/Dark Mode)* Contrast, elevation, and borders must remain distinct across light and dark modes.
- **Inspection Signals**:
  - Start from `scripts/token_inventory.js` output: distinct counts of colors, font sizes, radii, shadows, and spacing; mixed neutral palettes; mixed icon libraries; semantic-token vs. raw-value ratio. Quote the numbers as evidence ("11 distinct font sizes across 6 files").
  - Arbitrary one-off styles (e.g. `rounded-[7px]`, `style="padding: 13px"`, `box-shadow: 0 3px 9px ...`) vs design tokens (`rounded-md`, `p-4`, `var(--radius)`).
  - Mixed icon libraries (e.g. Lucide + FontAwesome + Heroicons with mismatched stroke weights).
- **Anti-Patterns**: Styling drift between adjacent forms; cards in dark mode disappearing into dark background due to missing border or elevation.

### `[MOTION]` Motion & Animation
- **Rules**:
  - Motion must have a purpose: showing cause and effect, where something came from or went, or a change of state. Decorative motion on core paths is a cost, not a feature.
  - Keep it quick: roughly 100–200ms for small interactions, 200–400ms for larger transitions. Exits should be faster than entrances. Animations must never delay the user's next action.
  - Respect `prefers-reduced-motion`: replace parallax, zooming, and large movement with fades or no motion. This protects users with vestibular disorders (WCAG 2.3.3 is AAA, but treat it as a baseline for large motion).
  - Auto-playing motion that lasts more than 5 seconds needs a way to pause it (SC 2.2.2). Nothing flashes more than 3 times per second (SC 2.3.1).
  - Animate `transform` and `opacity`. Animating layout properties (`width`, `height`, `top`, `margin`) causes stutter.
- **Inspection Signals**:
  - CSS: `transition`, `animation`, `@keyframes`, `@media (prefers-reduced-motion: reduce)`. Tailwind: `animate-*`, `duration-*`, `motion-safe:`, `motion-reduce:`.
  - JS: Framer Motion (`motion.*`, `AnimatePresence`, `useReducedMotion`), GSAP, Lottie, `<video autoplay loop>`, auto-advancing carousels (`setInterval` + slide index).
- **Anti-Patterns**: Infinite pulsing or bouncing call-to-action buttons; page-wide parallax with no reduced-motion fallback; long page transitions on every navigation; carousels that auto-advance with no pause control.

---

## Group 2: Content & Language

### `[COPY]` Content, Microcopy & Clarity
- **Rules**:
  - Action labels must be specific and verb-led ("Export CSV" vs. "Submit", "Delete Account" vs. "Confirm").
  - Domain terminology must remain uniform across the entire flow (no switching between "Workspace", "Organization", and "Team").
  - Copy must avoid placeholder or jargon-heavy language.
- **Inspection Signals**:
  - Strings inside `<button>`, `<a>`, `<label>`, `<p>`, `<Tooltip>`, i18n JSON translation files.
  - Vague headings ("Settings", "Manage", "Items") lacking clear context.
- **Anti-Patterns**: Ambiguous modal confirmation buttons ("OK" / "Cancel" on a destructive action); lorem ipsum or default template strings in production code.

### `[STATE]` Empty, Loading & Error States
- **Rules**:
  - Zero-data views must provide constructive onboarding guidance or a direct creation CTA.
  - Async operations that can take noticeably long (roughly >300ms) must show progress: skeletons that match the final layout for content, inline spinners or pending labels for actions. Avoid flashing a spinner for fast responses.
  - Error messages must explain (1) what happened, and (2) how the user can resolve it.
- **Inspection Signals**:
  - React: `isLoading ? <Skeleton/> : ...`, `items.length === 0 ? <EmptyState/> : items.map(...)`, `<Suspense>`.
  - Vue: `v-if="loading"`, `<template #empty>`, `v-if="items.length === 0"`.
  - Svelte: `{#if loading} <Skeleton/> {:else if items.length === 0} <Empty/> {:else} ... {/if}`.
  - Angular: `*ngIf="isLoading; else dataBlock"`, `@if (items.length === 0)`.
- **Anti-Patterns**: Blank white containers when arrays are empty; generic "An unexpected error occurred" without recovery steps; infinite spinners without timeout/retry fallbacks.

### `[I18N]` Localization & Content Resilience
*Content-resilience rules apply to every product. Localization rules apply when the product serves more than one language or locale.*
- **Rules**:
  - Layouts must survive real content: long names, user-generated text, and translated strings (German or Finnish often run 30–40% longer than English). Truncated text must show an ellipsis and offer the full text (tooltip, expand, or detail view).
  - Avoid fixed widths and heights on text containers; buttons grow with their labels.
  - Format dates, times, numbers, and currencies with locale APIs, never by concatenating strings (`'$' + price`).
  - In localized products, user-facing strings come from the i18n system. Use pluralization rules instead of string concatenation ("1 items").
  - For right-to-left languages (Arabic, Hebrew, Persian, Urdu), use logical CSS properties (`margin-inline-start`; Tailwind `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) and the `dir` attribute, and mirror directional icons.
  - Don't force one country's formats on a global audience: prefer a single "Full name" field over First/Last, and use flexible address and phone formats.
- **Inspection Signals**:
  - `Intl.DateTimeFormat`, `Intl.NumberFormat`, `toLocaleString`; i18n libraries (`react-i18next`, `next-intl`, `vue-i18n`, `@angular/localize`, `FormattedMessage`) vs. hard-coded strings.
  - `truncate`, `line-clamp-*`, `text-overflow: ellipsis`, `whitespace-nowrap`, fixed `w-[...]`/`h-[...]` on text, physical `ml-`/`mr-`/`left-`/`right-` in RTL-capable products.
- **Anti-Patterns**: Names truncated with no way to read them in full; button labels overflowing in translation; `MM/DD/YYYY` dates shown to non-US users; "1 items".

---

## Group 3: Interaction & Structure

### `[NAV]` Navigation & Information Architecture
- **Rules**:
  - The user must always know their current location (active nav link, breadcrumbs, page heading).
  - Navigation path from entry to task completion must be the shortest logical path without circular detours.
  - Back, cancel, and escape actions must preserve entered state and return to expected parent views.
- **Inspection Signals**:
  - Active route indicators (`aria-current="page"`, `router.pathname === link.href`, `:class="{ active: isActive }"`).
  - History push/replace handling and breadcrumb hierarchies.
- **Anti-Patterns**: Back buttons resetting entire multi-step wizards; deep nested menus (>3 levels) hiding core features.

### `[AFFORD]` Interaction Affordance & Touch Targets
- **Rules**:
  - Clickable/tappable elements must visually indicate interactivity (cursor pointer, hover/focus state changes).
  - Pointer targets must be at least 24×24 CSS px or adequately spaced (WCAG 2.2 AA, SC 2.5.8). On touch-first platforms, aim for the platform guidance of 44×44pt (Apple HIG) or 48×48dp (Material), counting padding and `hitSlop`, not just the icon size.
  - Disabled controls must make clear why they are disabled and what will enable them. Prefer keeping primary actions enabled and explaining problems on submit, because a disabled button can't tell the user what's wrong.
- **Inspection Signals**:
  - CSS: `min-h-[44px]`, `min-w-[44px]`, `cursor: pointer`, `:hover`, `:focus-visible`, `disabled:opacity-50`.
  - Event handlers on non-interactive elements:
    - React: `<div onClick={...}>` without `role="button"` or `tabIndex`.
    - Vue: `<div @click="...">` without accessibility attributes.
    - Svelte: `<div on:click="...">` triggering a11y linter warnings.
- **Anti-Patterns**: Tiny 16px icon buttons on mobile viewports; clickable table rows without hover state feedback.

### `[FORM]` Forms, Input Validation & Friction
- **Rules**:
  - Input labels must remain visible at all times (never placeholder-only labels).
  - Validation timing should follow "reward early, punish late": show an error only after the user leaves the field or submits, then clear it as soon as the input becomes valid while they type. Never show errors on the first keystroke. Check the form library's configured mode before flagging (see [false-positives.md](./false-positives.md)).
  - Errors must be shown next to the field, associated programmatically (`aria-describedby`, `aria-invalid`), and announced; on submit, move focus to the first invalid field or an error summary (SC 3.3.1, 3.3.3).
  - Don't ask users to re-enter information they already provided in the same flow (SC 3.3.7), and don't block paste into password or code fields (SC 3.3.8).
  - Inputs must declare explicit `type`, `inputmode`, `autocomplete`, and expected format hints.
  - Required fields must be clearly indicated prior to form submission.
- **Inspection Signals**:
  - HTML / Bindings:
    - React: `<input type="email" autoComplete="email" aria-describedby="err-1" />`
    - Vue: `<input type="tel" v-model="phone" autocomplete="tel" />`
    - Svelte: `<input type="password" bind:value={pwd} autocomplete="current-password" />`
    - Angular: `<input type="email" [(ngModel)]="email" formControlName="email" />`
- **Anti-Patterns**: Disappearing placeholder labels; format requirements (e.g. password rules) revealed only after validation failure; disabled submit buttons that don't explain what fields are incomplete.

### `[FLOW]` Task Flow Continuity & Friction
- **Rules**:
  - Multi-step tasks must visually track progress (step indicator, percentage).
  - Unnecessary inputs that can be inferred, defaulted, or deferred must not block task completion.
  - Users must not be asked for information they do not currently have.
- **Inspection Signals**:
  - Step progression logic, wizard state persistence, required step count.
- **Anti-Patterns**: Requiring credit card input for free-tier onboarding; forcing account creation before value demonstration in a sandbox tool.

### `[COGN]` Cognitive Load & Progressive Disclosure
- **Rules**:
  - Decision time grows with the number and similarity of choices (Hick's Law). Make one option clearly primary, group related options, and offer sensible defaults rather than following a fixed item limit. (The "7±2" figure is Miller's research on short-term memory and is not a menu-size rule.)
  - Advanced, rarely-used configurations must be progressively disclosed (behind "Advanced Settings" or accordions).
  - Do not require users to memorize information across distinct screens.
- **Inspection Signals**:
  - Form complexity, number of visible toggle switches, accordions, tabs.
- **Anti-Patterns**: Exposing 30 configuration toggles on a single screen without categorization or search.

### `[SRCH]` Search, Filtering & Sorting *(Conditional)*
*Applies to tables, catalogs, data lists, or repositories.*
- **Rules**:
  - Active search queries, filter pills, and sort orders must be visibly displayed with a 1-click "Clear All" option.
  - Empty search results must state the query searched and suggest broader terms.
- **Inspection Signals**:
  - Filter state management, tag/chip dismiss buttons, URL query parameter syncing (`searchParams`).
- **Anti-Patterns**: Hidden active filters that make users think data is lost; zero-result state without query feedback.

### `[DATA]` Data Display & Visualization *(Conditional)*
*Applies to data tables, charts, graphs, and metric dashboards.*
- **Rules**:
  - Tables must provide sticky headers for long lists, legible cell alignment (right-align numbers, left-align text), and pagination/virtualization.
  - Charts must have visible axis labels, units, legends, and hover tooltips.
  - Timestamps, currency, and numerical metrics must follow consistent formatting and locale standards.
- **Inspection Signals**:
  - `<Table>`, `Intl.NumberFormat`, `Intl.DateTimeFormat`, chart tooltip configurations.
- **Anti-Patterns**: Unaligned financial figures; missing units or legends in multi-series line charts.

---

## Group 4: System Trust & Feedback

### `[TRUST]` Feedback, Confirmation & Error Prevention
- **Rules**:
  - Destructive actions should prefer **undo** (soft delete, an undo toast) over confirmation dialogs, because frequent confirmations train users to click through without reading. Reserve confirmation for actions that truly cannot be undone, and make it specific: name the object and consequence, label the button with the action ("Delete 3 invoices", not "OK"). For high-stakes actions (deleting an account or workspace), use type-to-confirm.
  - Successful actions must provide unambiguous visual feedback (toasts, success banners, state transitions).
- **Inspection Signals**:
  - Confirmation dialog components (`<AlertDialog>`, `<Modal>`, `<dialog>`), undo toasts with countdown timers.
- **Anti-Patterns**: Single-click instant deletion of user data; silent mutation where UI state doesn't update to reflect API success.

### `[A11Y]` Accessibility & Keyboard Operability
- **Rules**:
  - Full keyboard navigation: every interactive element must be reachable via `Tab` / `Shift+Tab` and activated via `Enter` / `Space`.
  - Focus outlines must be distinctly visible (`:focus-visible` styles preserved, never `outline: none` without replacement).
  - Modals and dialogs must trap focus and close on `Escape`.
  - Asynchronous content changes must announce via `aria-live` regions or accessible status alerts.
  - All non-decorative images must provide meaningful `alt` text.
- **Inspection Signals**:
  - `tabindex`, `aria-modal="true"`, `role="dialog"`, `aria-live="polite"`, `alt=""`, focus trapping hooks (`useFocusTrap`, `focus-trap-vue`).
- **Anti-Patterns**: Divs with onClick without keyboard handlers; suppressed focus rings; modals that allow tabbing behind the overlay.

### `[PERF]` Perceived Performance & Optimistic UI
- **Rules**:
  - Button state must immediately reflect submission (spinner or disabled state) upon click to prevent double-submissions.
  - Instant optimistic updates should be applied where safe, with clear rollback error notifications if the server rejects the change.
- **Inspection Signals**:
  - Click event disabling (`disabled={isSubmitting}`, `:disabled="isPending"`), optimistic mutations (`useOptimistic`, TanStack Query `onMutate`, Pinia / Vuex optimistic state).
- **Anti-Patterns**: Unresponsive UI for several seconds during API calls; double-billing caused by multi-click on unprotected submit buttons.

### `[ETHIC]` Dark Patterns & Ethical Design
- **Rules**:
  - Cancelling is as easy as signing up: same channel, a similar number of steps, no forced phone calls or retention mazes.
  - Consent is opt-in. No pre-checked boxes for marketing, data sharing, or paid add-ons. Cookie and consent dialogs give "Reject" the same prominence as "Accept".
  - Prices are complete and shown early: no fees revealed only at the final step, and renewal terms and the trial end date are shown before payment.
  - No confirmshaming ("No thanks, I don't like saving money").
  - No false urgency or scarcity (countdowns that reset, "only 2 left" not backed by real data).
  - No trick questions (double negatives in opt-outs), disguised ads, or items added to the cart without the user's action.
  - Account-level controls exist and are findable: delete account, export data, manage notifications.
- **Inspection Signals**:
  - `defaultChecked`/`checked` on consent, marketing, or add-on checkboxes; the copy on decline links; countdown timers; cancel and delete-account routes (or their absence); fees added in checkout calculations; consent banners styling "Accept" as a button and "Reject" as a faint link.
- **Severity note**: Rate by user harm. Obstructed cancellation, hidden fees, and pre-checked consent usually *Impede* or *Block* (🟠 High or 🔴 Critical). Regulators in several jurisdictions treat these patterns as deceptive (e.g. the EU Digital Services Act's ban on deceptive interfaces, GDPR consent rules, state auto-renewal laws). Mention the risk in the problem statement, without giving legal advice.
- **Anti-Patterns**: "Call us to cancel"; a pre-checked "Send me offers" box; a $4.99 "service fee" first shown on the payment step; a fake 10-minute countdown.

---

## Group 5: Platform & Context

### `[PLAT]` Platform-Specific Conventions & Safe Areas
- **Rules**:
  - Layouts reflow down to 320px wide without horizontal scrolling (SC 1.4.10) and work in both orientations unless one is essential (SC 1.3.4).
  - Mobile layouts must respect notch/home-bar safe areas (`env(safe-area-inset-top/bottom)`).
  - Sticky headers and floating action buttons must not obscure form inputs or keyboard views.
  - Follow platform expectations (Jakob's Law): iOS/Android swipe gestures vs. desktop right-click / keyboard shortcuts (`Cmd/Ctrl+K`).
- **Inspection Signals**:
  - CSS: `padding-bottom: env(safe-area-inset-bottom)`, media queries (`@media (max-width: ...)`), shortcut listeners.
- **Anti-Patterns**: Mobile bottom navigation overlapping native device home indicators; desktop web apps lacking keyboard shortcuts for high-frequency actions.

### `[ONBD]` Onboarding & First-Use Experience *(Conditional)*
*Applies to signup, account initialization, or empty workspace views.*
- **Rules**:
  - New user experiences must highlight the primary path to first value (time-to-value optimization).
  - Initial setup steps must be concise and avoid unnecessary configuration walls.
- **Inspection Signals**:
  - Welcome walkthroughs, sample data templates, empty state onboarding cards.
- **Anti-Patterns**: Forcing 10 setup steps before showing the main application interface.

### `[PERS]` Personalization & State Persistence *(Conditional)*
*Applies to user preferences, table views, filter states, or theme choices.*
- **Rules**:
  - Table column visibility, sorting preferences, and filter configurations should persist across navigation or sessions when expected.
  - Draft inputs in long-form flows should be saved locally to prevent data loss on accidental navigation or refresh.
- **Inspection Signals**:
  - `localStorage`, `sessionStorage`, URL search parameter synchronization.
- **Anti-Patterns**: Filter settings resetting immediately upon navigating back from a detail view.
