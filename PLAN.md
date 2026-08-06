# 2026 Warm Modern Tech Design System Specifications

## 1. Vision & Core Design Principles

The **2026 Warm Modern Tech** design system elevates the Job Application Tracker into a state-of-the-art, editorial-grade tech tool. It combines rich warm slate surfaces, precise rectilinear geometry, warm amber and violet highlights, and ultra-crisp typography.

### Design System Pillars
- **Warm Modern Tech Surface Palette**: Rich warm slate backgrounds (`hsl(220 18% 97%)` in light mode, `hsl(224 25% 7%)` in dark mode) paired with warm violet (`hsl(255 80% 60%)`) and warm amber (`hsl(38 92% 50%)`) accents.
- **Sharp Rectilinear Geometry**: Uniform `rounded-md` corners across all components (cards, buttons, inputs, selects, sheets, badges) for a crisp, engineered precision.
- **Plus Jakarta Sans + Inter Typography**: Plus Jakarta Sans for bold editorial headings and section titles; Inter for ultra-legible body text and form controls.
- **Sharp Tinted Badges**: Rectilinear `rounded-md` status badges with soft tinted background fills and 1px subtle borders.

---

## 2. Color Tokens & Theme Architecture

### Global Variables (`app/globals.css`)

```css
@layer base {
  :root {
    /* Rich Warm Slate Light Mode */
    --background: 220 18% 97%;
    --foreground: 224 45% 11%;
    --card: 0 0% 100%;
    --card-foreground: 224 45% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 45% 11%;

    /* Brand Accents (Warm Violet & Amber) */
    --primary: 255 80% 60%;
    --primary-foreground: 0 0% 100%;
    --accent: 255 80% 95%;
    --accent-foreground: 255 80% 30%;

    --secondary: 220 16% 94%;
    --secondary-foreground: 224 45% 16%;
    --muted: 220 14% 93%;
    --muted-foreground: 220 12% 46%;

    --border: 220 14% 88%;
    --input: 220 14% 88%;
    --ring: 255 80% 60%;

    /* Status Color System */
    --status-applied: 255 80% 60%;
    --status-review: 199 89% 48%;
    --status-interview: 38 92% 50%;
    --status-accepted: 151 78% 37%;
    --status-rejected: 0 84% 60%;
    --status-ghosted: 220 12% 46%;

    --radius: 0.375rem; /* 6px / rounded-md rectilinear standard */
  }

  .dark {
    /* Rich Warm Slate Dark Mode */
    --background: 224 25% 7%;
    --foreground: 210 30% 98%;
    --card: 224 22% 10%;
    --card-foreground: 210 30% 98%;
    --popover: 224 22% 10%;
    --popover-foreground: 210 30% 98%;

    --primary: 255 85% 72%;
    --primary-foreground: 224 25% 7%;
    --accent: 255 30% 18%;
    --accent-foreground: 255 85% 92%;

    --secondary: 224 18% 15%;
    --secondary-foreground: 210 30% 94%;
    --muted: 224 16% 14%;
    --muted-foreground: 217 15% 65%;

    --border: 224 14% 18%;
    --input: 224 14% 18%;
    --ring: 255 85% 72%;
  }
}
```

---

## 3. Typography System (`Plus Jakarta Sans` + `Inter`)

- **Headings & Titles**: `Plus Jakarta Sans` (`font-bold`, `tracking-tight`).
- **Body & Controls**: `Inter` (`font-normal`, `font-medium`, `font-semibold`).
- **Utility Classes**:
  - `font-heading`: Applied to page headers, card titles, section labels.
  - `font-sans`: Applied to body copy, inputs, tables, metrics.

---

## 4. Component Refactoring & Implementation Plan

1. **`app/globals.css` & `app/layout.tsx`**:
   - Configure Google Fonts for `Plus Jakarta Sans` and `Inter`.
   - Update CSS variables for Warm Modern Tech theme.
   - Enforce `--radius: 0.375rem;` (`rounded-md`).

2. **Core UI Components (`components/ui/`)**:
   - `card.tsx`: Enforce `rounded-md border border-border/40 bg-card shadow-2xs`.
   - `button.tsx`: Enforce `rounded-md font-medium shadow-2xs active:scale-[0.98] transition-all`.
   - `badge.tsx`: Enforce `rounded-md border font-semibold text-xs px-2 py-0.5`.
   - `input.tsx`, `select.tsx`, `textarea.tsx`: Enforce `rounded-md border-input bg-background`.

3. **Navigation Components (`side-nav.tsx`, `nav.tsx`, `side-nav-mobile.tsx`)**:
   - Update branding, side nav active state styling (`bg-primary/15 text-primary rounded-md`), and breadcrumbs.

4. **Applications Section (`app/(pages)/applications`)**:
   - Update `DataTable`, `Columns`, `ApplicationsKpiSummary`, `ApplicationsKanban`, and `ApplicationDetailSheet` to conform to the rectilinear Warm Modern Tech design system.

5. **Analytics Section (`app/(pages)/analytics`)**:
   - Update Overview, Insights, Platform ROI, and all charts to conform to the design system.

---

## 5. Verification
- Execute `npm run build` to verify clean TypeScript compilation.
