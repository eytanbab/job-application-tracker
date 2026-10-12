# UX/UI Audit Report: ATS Resume Checker (`/ats-checker`) — Deep Sweep

- **Date**: 2026-08-18
- **Flow / Route**: `/ats-checker` (`http://localhost:3000/ats-checker`)
- **Audit Mode**: Interactive & Rendered Screenshot Capture (Playwright 375w, 768w, 1440w)
- **Screenshots Directory**: [`.ux-audit/screenshots/2026-08-18-ats-checker/`](file:///C:/Users/Eytan/next-js/job-application-tracker/.ux-audit/screenshots/2026-08-18-ats-checker/)
- **Personas**:
  - **Alex (Senior Fullstack Engineer)**: Demands fast feedback loops, hates data loss when toggling tabs, wants keyboard accessibility and full-summary export utilities.
  - **Sam (Career Transitioner / Mobile Job Seeker)**: Needs clear validation explanations before submitting, large mobile tap targets, and comprehensive keyword placement coaching.
- **Categories Checked**: Visual hierarchy & layout, Typography, Color & contrast, Visual consistency & design system adherence, Content & microcopy, Empty & loading & error states, Interaction & affordance, Forms & input, Task-flow friction, Cognitive load & complexity, Accessibility (ARIA).

---

## Executive Summary

A thorough source and interactive screenshot sweep of `/ats-checker` demonstrates an aesthetically pleasing, responsive foundation built entirely with shadcn/ui primitives. However, deep behavioral analysis revealed several critical state management and interaction flaws:

1. **Tab Switch State Loss**: Switching between "Upload PDF" and "Paste Text" tabs destroys previously uploaded files or typed drafts.
2. **Unguarded In-Flight Mutation**: Form inputs remain fully interactive while AI analysis is processing, creating race condition hazards.
3. **Silent Disabled Primary Action**: Muted submit button offers no visual explanation when inputs fall below minimum thresholds.
4. **Client-Side File Ingestion**: Dropzone advertises "Max 10MB" but lacks client-side file size guards, risking main-thread freezes.
5. **Mobile Touch Target Violations**: Help popover triggers on dimension cards are 14x14px without padding (<44px touch target guidelines).
6. **Truncated Placement Strategy**: Keyword gap matrix silently hides advice for items beyond the 4th keyword without an expander control.

---

## Severity-Ranked Findings

### 🔴 Critical (0 Findings)
*No app-crashing bugs or complete task blockers found.*

---

### 🟠 Major (5 Findings)

#### 1. Tab Switching Destroys Uploaded/Pasted Draft State
- **Location**: [`ResumeInputSection`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/resume-input-section.tsx#L133-L168)
- **Persona**: Alex (Senior Engineer) & Sam (Job Seeker)
- **Category**: Forms & input / Task-flow friction
- **Problem**: When a user uploads a PDF file and then clicks "Paste Text" (or vice versa), `onChange` immediately overwrites the state with an empty object (`{ type: "text", text: "" }`). If they click back to "Upload PDF", their previously selected file is wiped out, forcing them to re-upload.
- **Recommendation**:
  - Maintain independent local state for each tab (`selectedDocId`, `uploadedFilePayload`, `pastedTextDraft`). Switching tabs should simply switch the active mode while preserving drafted inputs.

#### 2. Inputs Remain Editable During Active Gemini Processing
- **Location**: [`AtsCheckerClient`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-checker-client.tsx#L85-L105)
- **Persona**: Alex & Sam
- **Category**: Interaction & affordance / Error states
- **Problem**: When `isAnalyzing` is true, only the submit button shows a spinner. The file dropzone, S3 dropdown, tab switcher, and job description textarea remain fully interactive. Users can delete or edit text while the request is in flight.
- **Recommendation**:
  - Pass `disabled={isAnalyzing}` to both [`ResumeInputSection`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/resume-input-section.tsx) and [`JobDescriptionInput`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/job-description-input.tsx) to freeze inputs during inference.

#### 3. Silent Disabled State on Primary Action Button
- **Location**: [`AtsCheckerClient`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-checker-client.tsx#L96-L118)
- **Persona**: Sam (Career Transitioner)
- **Category**: Forms & input / Interaction & affordance
- **Problem**: The "Run ATS Compatibility Scan" button is disabled by default with 50% opacity. If a user pastes a short 20-character snippet of a JD, the button remains silently disabled with no inline explanation of the 30-character requirement.
- **Recommendation**:
  - Add real-time requirement indicator badges above the button (e.g. *"✓ Resume uploaded • Need at least 30 chars of JD"*).

#### 4. Missing Client-Side File Size & MIME Type Validation
- **Location**: [`ResumeInputSection`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/resume-input-section.tsx#L51-L85)
- **Persona**: Sam & Alex
- **Category**: Forms & input / Error handling
- **Problem**: The dropzone text states *"Max 10MB"*, but `handleFileChange` and `handleDrop` directly read the file into memory via `FileReader.readAsDataURL` without checking `file.size` or `file.type`. Dropping a 40MB file or an unsupported format causes browser slowdowns.
- **Recommendation**:
  - Validate `file.size <= 10 * 1024 * 1024` and `file.type === "application/pdf"` before reading base64. Show an immediate toast error if invalid.

#### 5. Re-Scan Flow Loses Resume State
- **Location**: [`AtsCheckerClient`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-checker-client.tsx#L76-L79)
- **Persona**: Alex (Senior Engineer)
- **Category**: Task-flow friction / Navigation
- **Problem**: Users testing one resume against multiple job descriptions are forced to re-select or re-upload their resume when clicking "New Scan".
- **Recommendation**:
  - Add an **"Edit Inputs & Re-scan"** button to the results toolbar that preserves the current resume and JD in the form.

---

### 🟡 Minor (6 Findings)

#### 6. Mobile Primary Action Touch Target & Layout (375w)
- **Location**: [`AtsCheckerClient`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-checker-client.tsx#L96-L100)
- **Persona**: Sam (Mobile User)
- **Category**: Interaction & affordance / Mobile-specific
- **Problem**: On narrow mobile screens (375w), the submit button is right-aligned in a small corner instead of expanding to `w-full` for comfortable single-thumb reach.
- **Recommendation**:
  - Apply `w-full sm:w-auto` to the submit button container.

#### 7. Missing Keyword Placement Advice Truncation
- **Location**: [`KeywordGapMatrix`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/keyword-gap-matrix.tsx#L126)
- **Persona**: Sam (Job Seeker)
- **Category**: Content & microcopy / Information density
- **Problem**: The placement strategy list hardcodes `missingKeywords.slice(0, 4)`. If Gemini returns 8 missing keywords, the advice for the last 4 keywords is silently omitted with no way to view it.
- **Recommendation**:
  - Render all placement items or add a *"Show all (X) placement tips"* toggle button.

#### 8. Sub-44px Popover Touch Target on Dimension Breakdown Cards
- **Location**: [`AtsDimensionBreakdown`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-dimension-breakdown.tsx#L77-L85)
- **Persona**: Sam (Mobile User)
- **Category**: Interaction & affordance / Touch targets
- **Problem**: The info popover trigger is a raw `<HelpCircle className="h-3.5 w-3.5" />` icon without padding, creating a 14x14px clickable area that violates mobile touch guidelines.
- **Recommendation**:
  - Wrap the icon in a padded `h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted` button.

#### 9. Static Progress Bar Colors for Failing Scores
- **Location**: [`AtsDimensionBreakdown`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-dimension-breakdown.tsx#L37-L62)
- **Persona**: Alex & Sam
- **Category**: Color & contrast / Data visualization
- **Problem**: Each dimension has a hardcoded color (`bg-blue-500`, `bg-emerald-500`, `bg-amber-500`, `bg-indigo-500`) regardless of whether the candidate scored 15% or 95%. A failing 20% in Hard Skills is displayed in bright blue.
- **Recommendation**:
  - Dynamically style progress bars by score tier: `score >= 75` (Emerald), `score >= 50` (Amber), `score < 50` (Rose).

#### 10. Lack of "Try Sample Job Description" Button
- **Location**: [`JobDescriptionInput`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/job-description-input.tsx#L40-L46)
- **Persona**: Sam & Alex (New Visitors)
- **Category**: Task-flow friction / Empty states
- **Problem**: First-time visitors have to leave the app to copy a job posting before seeing what the ATS scanner does.
- **Recommendation**:
  - Add a *"Try Sample Job Description"* button next to "Clear" to load a realistic posting with 1 click.

#### 11. Missing "Copy Full Diagnosis Report" Action
- **Location**: [`AtsCheckerClient`](file:///C:/Users/Eytan/next-js/job-application-tracker/app/(pages)/ats-checker/components/ats-checker-client.tsx#L125-L135)
- **Persona**: Alex (Senior Engineer)
- **Category**: Content & microcopy / Export
- **Problem**: Users cannot copy the entire diagnostic report (Score, Matched Keywords, Missing Keywords, Checklist) to their clipboard for external notes.
- **Recommendation**:
  - Add a `"Copy Full Report"` button to the results toolbar.

---

## Positive Observations

- **100% shadcn/ui Primitives**: Strict adherence to pre-built components (`Card`, `Button`, `Badge`, `Select`, `Textarea`, `Popover`).
- **Strict Anti-AI Prompt Quality**: Completely eliminated corporate buzzwords ("spearheaded", "synergized") in favor of concrete engineering verbs and Google XYZ impact structure.
- **Accessible Color Contrast**: All grade badges, progress indicators, and text pairings exceed WCAG AA requirements (≥4.5:1 ratio).
- **Responsive Viewport Breakdown**: Smooth transition from 2-column desktop grid to stacked mobile and tablet layouts.

---

## Action Checklist for Developers

- [ ] **1. Draft State Memory**: Maintain independent tab state in `ResumeInputSection` so switching tabs does not erase uploaded files or pasted text.
- [ ] **2. Freeze In-Flight Inputs**: Pass `disabled={isAnalyzing}` to form inputs while analysis is running.
- [ ] **3. Requirement Indicators**: Show live validation pills above the primary action button.
- [ ] **4. File Guards**: Validate file size (<10MB) and format (PDF) on the client before `FileReader` execution.
- [ ] **5. Re-Scan Action**: Add an "Edit Inputs & Re-scan" button to the results view.
- [ ] **6. Mobile CTA**: Apply `w-full sm:w-auto` to the submit button for mobile thumb reach.
- [ ] **7. Placement Advice Expander**: Render all missing keyword advice or provide a toggle.
- [ ] **8. 44px Touch Targets**: Add padding to dimension card popover triggers.
- [ ] **9. Dynamic Progress Colors**: Color dimension bars by score tier (Emerald/Amber/Rose).
- [ ] **10. Sample JD**: Add a 1-click "Try Sample Job Description" button.
- [ ] **11. Copy Report**: Add a "Copy Full Report" button to the results header.
