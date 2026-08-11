# Agent Directives & Repository Standards — Job Application Tracker

This document defines the strict architectural directives, code reuse policies, verification workflows, and Git conventions for all AI agents and human developers working on this codebase.

---

## 1. Project Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router with Turbopack), React 19, TypeScript (Strict Mode).
- **Authentication**: Clerk (`@clerk/nextjs`).
- **Database & ORM**: PostgreSQL via Neon Serverless (`@neondatabase/serverless`) & Drizzle ORM (`drizzle-orm`, `drizzle-kit`). Schema is located at `app/db/schema.ts`.
- **Styling & UI**: Tailwind CSS v4, PostCSS, Radix UI primitives, shadcn/ui components (`components/ui/`), Lucide icons (`lucide-react`).
- **Forms & Validation**: React Hook Form (`react-hook-form`), Zod (`zod`), `@hookform/resolvers/zod`, `drizzle-zod`.
- **State & Tables**: TanStack Table (`@tanstack/react-table`), Nuqs (`nuqs` for URL search param state).
- **External Integrations**: AWS S3 (`@aws-sdk/client-s3`), Google GenAI (`@google/genai`), Playwright (`playwright`).

---

## 2. Component & Code Reuse Standards

- **Audit Before Writing**: Search `components/ui/`, `components/`, `hooks/`, and `lib/` before writing custom UI components or helper logic.
- **Reuse UI Primitives**: Use pre-built components in `components/ui/` (`Button`, `Card`, `Dialog`, `Table`, `Select`, `Input`, `Toast`, `Badge`, `Skeleton`, `Sheet`, `ComboboxInput`) rather than custom JSX or inline styles.
- **Icon Consistency**: Import icons exclusively from `lucide-react`. Do not paste raw SVG blocks into JSX.
- **Type Inference from Schema**: Derive TypeScript types from Drizzle schema (`app/db/schema.ts`) using `drizzle-zod` or Drizzle's `$inferSelect` / `$inferInsert` instead of creating redundant interface types.
- **Extend Utilities**: Use `lib/utils.ts` for helper functions (`cn`, formatting, parsing). Do not duplicate utility methods.

---

## 3. Database Schema & Migration Rules

- **Schema Location**: All database tables and relations must be defined in `app/db/schema.ts`.
- **Generating Migrations**: When changing the schema, generate migrations using `npx drizzle-kit generate`.
- **Migration Safety**: Never manually edit existing migration files in `./migrations` after they have been committed.

---

## 4. Git Commit Standards

### Atomic Commits

- Each commit must represent a single, logical unit of work.
- Do NOT combine refactorings, bug fixes, formatting tweaks, or new features into a single commit.
- Stage files selectively (`git add <path>` or `git add -p`) before creating a commit.

### Conventional Commits Format

```text
<type>(<scope>): <description>

[optional body explaining technical justification]
```

#### Allowed Types

- `feat`: New user-facing feature.
- `fix`: Bug fix.
- `docs`: Documentation updates.
- `style`: Formatting or whitespace adjustments (no logic change).
- `refactor`: Restructuring code without changing external behavior.
- `perf`: Performance improvement.
- `test`: Adding or correcting tests.
- `chore`: Dependency or build configuration updates.

#### Recommended Scopes

Use relevant module scopes: `ui`, `db`, `auth`, `api`, `tracker`, `scraper`, `s3`, `ai`.

### Constraints

- **Imperative Present Tense**: Use `Add user login`, `Fix memo leakage` (NOT `Added` or `Fixes`).
- **Subject Length**: Maximum **50 characters**.
- **No Trailing Period**: Do not end the subject line with a period.

---

## 5. Environment & Execution Constraints (Windows)

- **No Bash Command Chaining (`&&`)**: Windows shell commands must be run sequentially on separate lines.
- **Selective Staging**: Do not use `git commit -a` blindly. Inspect `git status` and stage files explicitly.

---

## 6. Verification & Diagnostic Integrity

- **Log-First Diagnostics**: Fetch and inspect full error logs/tracebacks before diagnosing issues.
- **No Superficial Symptom Patches**: Address underlying root causes. Do not swallow errors, add dummy fallbacks, or comment out failing checks.
- **Empirical Verification**: Run verification commands (`npx tsc` for type checking, `npm run build` for build verification) before declaring any task complete.

---

## 7. Commit Examples

### Good Examples

```text
feat(auth): add Clerk user sync webhook
```

```text
fix(db): resolve application status enum mismatch

Update status schema definition to include withdrawn state.
```

```text
refactor(ui): extract JobTableRow component
```

### Bad Examples

- ❌ `Updated job table styles and fixed db bug` (Not atomic)
- ❌ `feat(tracker): Added support for sorting jobs by application date` (> 50 chars, past tense "Added")
- ❌ `fix: fixed bug.` (Non-imperative, period at end)
