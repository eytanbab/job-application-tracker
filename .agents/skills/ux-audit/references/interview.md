# Project Context Intake & Auto-Detection Protocol

Before auditing, the agent must establish accurate project context to build meaningful personas. To minimize conversational friction, use the **Auto-Detect & Confirm** workflow.

---

## Workflow: Auto-Detect & Confirm

1. **Inspect Workspace**: Scan project configuration and routing files.
2. **Draft Context**: Pre-populate `product_description`, `audience`, `platform`, `business_model`, and `tech_stack`.
3. **Single-Turn Confirmation**: Present the pre-filled summary to the developer for 1-click approval or quick tweaks.
4. **Save**: Write the verified context to `.ux-audit/context.json`.

---

### Phase 1: Autonomous Codebase Inspection

Before prompting the developer, inspect the workspace:
1. **Manifests**: Check `package.json`, `pyproject.toml`, `Cargo.toml`, or `go.mod`:
   - Identify UI frameworks (React, Vue, Svelte, Angular, Solid, React Native, Electron).
   - Identify CSS and component libraries (TailwindCSS, Radix, Shadcn/UI, MUI, Chakra, Sass, Bootstrap).
   - Save detected libraries into the `tech_stack` array in `context.json`.
2. **Documentation**: Scan `README.md` or `docs/` for product purpose, target users, and business model (B2B, B2C, internal tool).
3. **Routing Structure**: List routing and view directories (e.g., `app/`, `pages/`, `src/routes/`, `src/views/`, `src/components/`) to identify key user flows.

---

### Phase 2: Confirmation Interaction

Present the drafted context to the developer in a single message or interactive prompt:

```text
I inspected your repository and detected the following UX context:
- Product: [1-sentence description]
- Primary Audience: [Role / Goal / Operational Constraints]
- Platform: [e.g., Web]
- Tech Stack: [e.g., React, TailwindCSS, Radix UI]
- Business Model: [e.g., B2B SaaS]

Does this look accurate, or would you like to tweak anything before we select a flow to audit?
```

- If the developer **confirms**: Save to `.ux-audit/context.json` (including `tech_stack`) and proceed directly to flow selection (Step 2).
- If the developer **adjusts**: Apply adjustments and save.
- If the host agent supports interactive selection tools (e.g. `ask_question`), render a structured prompt with pre-selected defaults.

---

## Phase 3: Conversational Fallback (Cold Intake)

If workspace inspection yields insufficient signal, ask the following 4 core questions:

1. **What does this product do, and who is it for?**
   - *Target*: Specific role, primary goal, operational constraints.
2. **Business model & platform?**
   - *Options*: B2B, B2C, B2B2C, Internal Tool | Web, iOS, Android, Desktop.
3. **What is the primary tech stack?**
   - *Options*: React, Vue, Svelte, Angular, vanilla HTML/CSS, Tailwind, etc.
4. **Any known user complaints, drop-off points, or pain points?**
   - *Target*: Real user feedback or support tickets (ground truth).
5. **Is there a reference or competitor product to benchmark against?** *(Optional)*
   - *Target*: Industry standards and conventions (Jakob's Law).

---

## Handling Thin Answers & Guardrails

- **Thin Answer Definition**: Answers lacking a concrete role or constraint (e.g., "everyone", "all users", "general consumers").
- **Grounded Follow-Up Rule**: Ask exactly one specific follow-up referencing the domain:
  - *Developer says*: "It's a scheduling tool for clinics, for everyone."
  - *Follow-up*: "Is the primary user clinic front-desk staff booking appointments, or patients self-scheduling?"
- **Fallback Persona Rule**: If the answer remains thin or the developer asks to skip ("just use generic assumptions"):
  - Set `"audience_is_generic_fallback": true` in `context.json`.
  - Use 3 standard baseline personas:
    1. *First-time user*: Unfamiliar with domain jargon, requires clear visual guidance.
    2. *Power/repeat user*: Needs high density, keyboard navigation, and fast task completion.
    3. *Constrained user*: Operating on small mobile viewports, high ambient glare, or low network bandwidth.
