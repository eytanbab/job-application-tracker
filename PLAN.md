# 2026 `/applications` Page UX/UI Optimization Plan

Based on our comprehensive UX/UI audit and shared design decisions from our `/grill-me` session, here is the complete plan to elevate `/applications` into a state-of-the-art, intuitive, user-centric 2026 experience.

---

## 1. Instant Slide-over Creation Sheet
- **File**: [`data-table.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/data-table.tsx)
- **Improvement**:
  - Replace full-page navigation to `/applications/new` with an instant slide-over creation sheet directly on `/applications`.
  - Include the AI URL Auto-Extractor built-in at the top of the creation sheet.
  - Keep users seamlessly in their active list/board context without disorienting page reloads.

---

## 2. Multi-Select Filter Toolbar Controls
- **File**: [`data-table.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/data-table.tsx)
- **Improvement**:
  - Add **Platform** filter dropdown (LinkedIn, Indeed, Glassdoor, Direct, etc.).
  - Add **Location** filter dropdown (Remote, Hybrid, On-site).
  - Add active filter badges and a unified "Reset Filters" button.

---

## 3. Bulk Selection & Floating Action Bar
- **Files**: [`columns.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/columns.tsx), [`data-table.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/data-table.tsx)
- **Improvement**:
  - Add row selection checkboxes to the Table view header and cells.
  - Render a floating bottom action bar when 1+ rows are selected.
  - Support bulk status updates (e.g. mark selected as Ghosted or Rejected in 1 click) and bulk deletion.

---

## 4. Kanban Native Drag-and-Drop & Stage Move Buttons
- **File**: [`applications-kanban.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/components/applications-kanban.tsx)
- **Improvement**:
  - Implement HTML5 native drag-and-drop between Kanban columns with instant drop target glow states.
  - Add quick 1-tap stage move arrows on card hover for rapid column shifting.
  - Add column application count badges to column headers.

---

## 5. Rich Empty States & Micro-UX Polish
- **Files**: [`data-table.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/data-table.tsx), [`applications-kanban.tsx`](file:///C:/Users/Anna/development/job-application-tracker/app/(pages)/applications/components/applications-kanban.tsx)
- **Improvement**:
  - Replace plain empty text with rich visual empty states, helpful descriptions, and primary CTA buttons ("Add Application" or "Reset Filters").

---

## Verification
1. Test creation sheet, filters, bulk selection, and drag-and-drop.
2. Run `npm run build` to verify clean compilation.
