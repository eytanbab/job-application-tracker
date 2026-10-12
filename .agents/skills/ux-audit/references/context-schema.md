# context.json Schema & Reference

The `.ux-audit/context.json` file persists project context, audience personas, and tech stack information across runs at the root of the audited repository.

---

## 1. JSON Schema (Draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "UXAuditProjectContext",
  "description": "Persisted project and persona context for the ux-audit agent skill.",
  "type": "object",
  "properties": {
    "$schema": {
      "type": "string"
    },
    "product_description": {
      "type": "string",
      "description": "What the product does, core purpose, and target domain."
    },
    "audience": {
      "type": "string",
      "description": "Target users including roles, goals, technical proficiency, and constraints."
    },
    "audience_is_generic_fallback": {
      "type": "boolean",
      "default": false,
      "description": "True only if the developer skipped the intake interview and fallback generic personas were used."
    },
    "business_model": {
      "type": "string",
      "enum": ["B2B", "B2C", "B2B2C", "Internal Tool", "Open Source", "Other"],
      "description": "Business model classification."
    },
    "platform": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["web", "mobile-web", "ios", "android", "desktop-electron", "desktop-native"]
      },
      "minItems": 1,
      "description": "Target runtime platforms for the audited product."
    },
    "tech_stack": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Detected or reported UI frameworks, component libraries, or CSS systems (e.g., React, Vue, Svelte, Angular, TailwindCSS, Radix, Material-UI)."
    },
    "known_pain_points": {
      "type": "string",
      "description": "Explicitly reported prior user complaints, support tickets, or drop-off friction."
    },
    "reference_product": {
      "type": "string",
      "description": "Benchmark or competitor product to evaluate conventions against (Jakob's Law)."
    },
    "last_flow": {
      "type": "string",
      "description": "Slug of the most recently audited flow for quick re-audit defaults."
    },
    "last_updated": {
      "type": "string",
      "format": "date",
      "description": "ISO 8601 date (YYYY-MM-DD) of the last update to project context."
    }
  },
  "required": [
    "product_description",
    "audience",
    "audience_is_generic_fallback",
    "business_model",
    "platform",
    "tech_stack",
    "last_flow",
    "last_updated"
  ],
  "additionalProperties": true
}
```

---

## 2. Example `context.json`

```json
{
  "product_description": "Cloud-based clinical appointment scheduling and patient intake dashboard.",
  "audience": "Clinic front-desk receptionists booking under time pressure; secondary audience is patients confirming via SMS/email.",
  "audience_is_generic_fallback": false,
  "business_model": "B2B",
  "platform": ["web"],
  "tech_stack": ["React", "TailwindCSS", "Radix UI"],
  "known_pain_points": "Staff reports that multi-step intake form feels sluggish and freezes on confirmation.",
  "reference_product": "Zocdoc / SimplePractice",
  "last_flow": "patient-intake",
  "last_updated": "2026-08-22"
}
```

---

## 3. Field Rules & Constraints

1. **`tech_stack`**:
   - Contains UI frameworks (React, Vue, Svelte, Angular, Solid), UI libraries (Radix, MUI, Shadcn, Chakra), and styling solutions (Tailwind, CSS Modules, Styled Components, SCSS).
   - Populated automatically during codebase inspection or confirmed during intake.
2. **`known_pain_points`**:
   - Contains **only** feedback explicitly provided by the developer or user.
   - **DO NOT** populate with audit findings; audit findings belong strictly in `.ux-audit/reports/`.
3. **`audience_is_generic_fallback`**:
   - Set to `true` when auto-detection or user intake was skipped.
   - Serves as a trigger in Step 1 to prompt the user to upgrade to real personas.
4. **`last_updated`**:
   - Must be updated in `YYYY-MM-DD` format whenever fields change or after each completed audit.
   - Audits check this date: if `> 90 days` old, prompt the user to re-verify context accuracy.
5. **`additionalProperties: true`**:
   - Permissive schema allows backward-compatible future extensibility without breaking older project files.
