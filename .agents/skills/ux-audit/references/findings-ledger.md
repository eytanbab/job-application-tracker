# Findings Ledger

`.ux-audit/findings.json` is the source of truth for every finding across all runs and flows. It gives each issue a **stable ID** that never changes or gets reused, tracks its status, and remembers decisions the team made, such as "won't fix" or "false positive", so later runs don't nag about them.

Reports are snapshots generated from the ledger. Never re-derive IDs by parsing old reports, except for the one-time `migrate` command.

---

## 1. Structure

```json
{
  "schema_version": 1,
  "counters": { "FORM": 2, "A11Y": 1 },
  "findings": [
    {
      "id": "FORM-01",
      "category": "FORM",
      "rule": "placeholder-only-label",
      "title": "Placeholder text is the only label on all 6 fields",
      "flows": ["signup"],
      "location": { "file": "src/components/auth/AuthInput.tsx", "line": 18, "anchor": "AuthInput <input>" },
      "severity": "high",
      "confidence": "code-confirmed",
      "effort": "low",
      "status": "open",
      "first_flagged": "2026-08-22",
      "last_seen": "2026-08-22",
      "resolved_on": null,
      "status_note": null,
      "history": [
        { "date": "2026-08-22", "report": "reports/2026-08-22-signup.md", "event": "new", "severity": "high" }
      ]
    }
  ]
}
```

| Field | Rules |
| :--- | :--- |
| `id` | `CAT-NN`, allocated with `node <skill-path>/scripts/ledger.js allocate CAT`. Unique per project, across all flows. Never reused, even after a finding is resolved. |
| `rule` | Short kebab-case slug for *what is wrong*, independent of wording: `placeholder-only-label`, `missing-pending-state`, `low-text-contrast`, `missing-focus-indicator`, `icon-button-no-name`, `no-empty-state`, `generic-error-copy`, `destructive-no-undo`, `asks-unavailable-info`, `off-token-style`, `pre-checked-consent`. Reuse an existing slug from the ledger whenever one fits. |
| `location.anchor` | The component, element, or screen region (e.g. `SignupForm submit button`). It survives line moves and file renames. |
| `flows` | Every flow slug in which the finding appears (a shared component can appear in several). |
| `severity` / `confidence` / `effort` | Lowercase values from [severity.md](./severity.md). Needs-verification items are **not** stored in the ledger; they stay in the report's To Verify table until confirmed. |
| `status` | `open` · `resolved` · `wont-fix` · `false-positive` |
| `status_note` | Required for `wont-fix` and `false-positive`: who decided it and why. |
| `history` | One entry for each event: `new`, `seen`, `severity-changed`, `resolved`, `regressed`, `wont-fix`, `false-positive`, `reopened`, `migrated`. |

---

## 2. Each Run (SKILL.md Step 6)

1. **Load**: run `node <skill-path>/scripts/ledger.js list --status all --flow <slug>`. If no ledger exists but `.ux-audit/reports/` contains reports, run `migrate` first. Otherwise start with an empty ledger.
2. **Match** each verified finding from this run to an existing entry, in this order:
   1. Same `category` + `rule` + `location.file` → the same finding (the line may have moved).
   2. Same `category` + `rule` + matching `anchor` in a renamed or moved file → the same finding; update `location`.
   3. Same `category` + `rule` + same root cause described in the title, when the code was refactored → the same finding. Use judgment, and explain the match in the history entry.
   4. No match → a **new** finding. Allocate an ID.
3. **Update matched entries**:
   - `open` → set `last_seen`, add a `seen` history entry. If the severity changed, record `severity-changed` with the reason.
   - `resolved` → it came back: set status `open`, add `regressed`. Report it under Recurring, marked **Regressed**.
   - `wont-fix` / `false-positive` → **do not report it**. Count it in Method & Evidence ("Suppressed: 2"). Reopen it only if the code around it changed materially, and say why.
4. **Resolve**: for each `open` entry in this flow that you did *not* re-find, open its location and confirm the problem is actually gone. Then set `resolved`, `resolved_on`, and add a `resolved` history entry, and list it under *Resolved Since Last Audit*. If the location is outside this run's scope, or you could not check it, leave it `open` and don't touch `last_seen`.
5. **Validate**: run `node <skill-path>/scripts/ledger.js validate` and fix any errors before writing the report.

---

## 3. Developer Decisions

Developers can change a finding's status in conversation at any time, for example:
- *"FORM-03 is a false positive, the label comes from the parent."* → set `false-positive`, write `status_note` ("Label provided by `FormField` wrapper, per developer, 2026-09-02"), and add a history entry. Also add the cause to *Checked & cleared* in future reports when it's a recurring trap.
- *"We won't fix DSYS-02, legacy screen being replaced."* → set `wont-fix` with the note.
- *"Reopen A11Y-01."* → set `open` and add a `reopened` entry.

Always confirm the change back to the developer in one line, then run `validate`.

---

## 4. Version Control

Recommend committing `.ux-audit/context.json`, `.ux-audit/findings.json`, and `.ux-audit/reports/`, so the team shares one history and decisions. Screenshots are large and may contain personal data: recommend adding `.ux-audit/screenshots/` to `.gitignore`.
