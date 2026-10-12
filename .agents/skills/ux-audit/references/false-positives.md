# False-Positive Traps & Verification Protocol

A report with one confidently wrong finding loses the reader's trust in every other finding. Before filing any **Code-confirmed** finding, run the verification protocol. If you cannot complete it, file the issue as **Needs verification** (see [severity.md](./severity.md)).

---

## 1. Verification Protocol (run before every Code-confirmed finding)

1. **Is it rendered?** Confirm the component is reachable from the flow's entry route. Exclude dead code, Storybook stories, tests, fixtures, and components behind a disabled feature flag.
2. **Trace upward.** Check parents and layouts. The label, error boundary, loading state, or focus handling you think is missing is often supplied by a wrapper (`<FormField>`, `<Field>`, layout component, route boundary).
3. **Trace the styles.** Check global CSS, the theme or Tailwind config, CSS variables, `@layer base`, and the component library's defaults before claiming a style is missing or wrong. Resolve tokens to real values before any contrast claim, and compute them with `scripts/contrast.js`, never by eye.
4. **Check the library.** If the element comes from a component library, check what that library already provides (section 2). Spread props (`{...props}`, `v-bind="$attrs"`) can pass in `aria-*`, `id`, or `className` from the caller, so check the call site too.
5. **Check the platform.** Native elements bring behavior for free (section 3).
6. **Still unsure?** File as **Needs verification** and state exactly what would confirm it ("Check in browser: does focus return to the trigger after closing?").

When a check clears a suspected issue, record it under **Checked & cleared** in the report's method notes. This shows rigor and stops the next run from re-raising it.

---

## 2. What Common Libraries Already Handle

Do not flag these as missing when the library primitive is used as intended. Do still flag misuse, e.g. a Radix Dialog with no `DialogTitle`, or an `asChild` trigger wrapping a non-focusable `<div>`.

| Library | Already provides | Still check |
| :--- | :--- | :--- |
| **Radix UI / shadcn/ui** | Dialog, AlertDialog, Sheet, Popover, DropdownMenu, Select, Tabs: focus trapping, Escape to close, focus return, correct roles, arrow-key navigation, `aria-expanded`/`aria-controls`. AlertDialog does not close on outside click. | A `DialogTitle` must exist; it can be visually hidden. Triggers must be real buttons. Custom content inside still needs labels. |
| **shadcn/ui `Button`, `Input`** | `focus-visible` ring styles (an `outline-none` paired with a `focus-visible:ring-*` replacement is correct). | Overrides via `className` that remove the ring. Icon-only buttons still need an accessible name. |
| **shadcn/ui `Form` (react-hook-form)** | `FormLabel`, `FormDescription`, `FormMessage` wire `htmlFor`, `aria-describedby`, and `aria-invalid` automatically. | Inputs used outside `FormField`/`FormControl` lose this wiring. |
| **Headless UI** | Dialog, Menu, Listbox, Combobox, Tabs, Disclosure: focus management, keyboard navigation, ARIA roles and states. | Visible focus styles are your app's responsibility (Headless UI is unstyled). |
| **React Aria / React Spectrum** | Comprehensive keyboard, focus, ARIA, and touch/press handling. | Visual styling and copy. |
| **MUI** | `Modal`/`Dialog` focus trap and Escape; `TextField` renders a real `<label>` and links `helperText` via `aria-describedby`; `Button` has a visible focus state. | Custom `InputBase` without a label; low-contrast custom theme colors. |
| **Chakra UI** | `FormControl` wires label, helper, and error text; `Modal` traps focus. | Inputs outside `FormControl`. |
| **Angular Material / CDK** | `MatDialog` focus trap and Escape, `cdkTrapFocus`, `mat-form-field` label and error association. | Custom controls not using `ControlValueAccessor`. |
| **Vuetify / PrimeVue / Quasar** | Dialog focus handling and form-field labels on their standard components. | Check the library version's a11y docs before claiming a gap. |
| **react-hook-form** | Default `mode: 'onSubmit'` with `reValidateMode: 'onChange'`: errors appear only after submit, then clear as the user fixes them. This is the recommended "reward early, punish late" timing. Default `shouldFocusError: true` moves focus to the first invalid registered field on submit. | `mode: 'onChange'` or `'all'` on long or complex fields (errors fire while typing). Custom inputs that don't forward the `ref` from `register` lose focus-on-error. |
| **Formik / VeeValidate / Zod** | Validation timing set by config (`validateOnBlur`, `validateOnChange`, `validateOn*`). | Read the config before claiming aggressive validation. |
| **Next.js (App Router)** | `loading.tsx` provides a route-level loading state, `error.tsx` an error boundary, `not-found.tsx` a 404. `<Link>` renders a real `<a>`. | Client-side mutations and data fetching inside a page still need their own pending and error states. |
| **Nuxt / SvelteKit / Remix** | Route-level loading, error, and pending UI conventions (`error.vue`, `+error.svelte`, `ErrorBoundary`, `useNavigation`). | Same as above: in-page async work is not covered. |
| **React Native** | `Pressable`/`Touchable*` with `hitSlop` extend the tap area beyond the visual size. | Measure `hitSlop` plus visual size before flagging small targets. Check `accessibilityLabel` on icon-only touchables. |

---

## 3. What the Platform Already Handles

- **`<button>`** is focusable and activates on Enter and Space. Do not flag missing `tabIndex` or key handlers on real buttons.
- **`<a href>`** is focusable and activates on Enter. `<a>` without `href` is **not**, so flag that.
- **`<label>` wrapping an input** associates them implicitly; `htmlFor` is not required in that case.
- **`<dialog>` opened with `showModal()`** makes the rest of the page inert, closes on Escape, and moves focus inside. `show()` (non-modal) does none of this.
- **`<input type="email|tel|url|number">`** already brings the matching mobile keyboard; `inputmode` is only needed for text inputs that want a specific keyboard.
- **`alt=""`** is correct for decorative images. Flag a **missing** `alt` attribute, or empty `alt` on an informative image, not empty `alt` as such.
- **`aria-hidden="true"` on icons** next to visible text is correct.
- **`.sr-only` / `.visually-hidden` text** provides an accessible name, even though it doesn't show in the markup's visible text.
- **Tailwind v3 `outline-none`** sets a transparent outline, which still shows in Windows forced-colors mode. Only flag it when no visible `focus-visible:` replacement exists. (In Tailwind v4, that transparent behavior moved to `outline-hidden`, and `outline-none` removes the outline completely.)

---

## 4. WCAG Exceptions Often Missed

- **Contrast (1.4.3)** does not apply to disabled controls, purely decorative text, or logotypes. Do apply it to placeholder text and text over images (check the worst-case area of the image).
- **Large text** is ≥ 24px regular, or ≥ 18.66px (14pt) at bold weight (700+). It needs 3:1, not 4.5:1.
- **Target size (2.5.8, AA)** is 24×24 CSS px, with exceptions for inline links in text, targets with enough spacing (a 24px circle centered on each target doesn't overlap another target), and controls whose size is set by the user agent. 44×44pt (Apple) and 48×48dp (Material) are platform guidance, not WCAG AA requirements; cite them as such.
- **Non-text contrast (1.4.11)** at 3:1 applies to the visual boundary that identifies a control (e.g. an input's border) and to focus indicators, not to every decorative border.

---

## 5. Source-Reading Traps

- **Styles applied elsewhere.** `className` merged with `cn()`/`clsx()`/`twMerge()` can be overridden by the caller. Check the call site.
- **Conditional rendering upstream.** A component with no empty state may only render when data exists; the parent may handle the empty case.
- **i18n.** Strings may live in translation files (`en.json`, `messages/`, `locales/`). Review copy there, and don't flag "missing text" when a translation key is used.
- **Responsive variants.** `hidden md:flex` means mobile and desktop render different elements. Don't flag a "missing" mobile control without checking the other variant.
- **Server vs. client.** In frameworks with server rendering, loading and error handling may happen on the server or at the route level.
- **Generated or vendored code.** UI copied from shadcn/ui into `components/ui/` is owned by the project and can be audited, but report library-pattern issues once at the primitive, not at every usage.
