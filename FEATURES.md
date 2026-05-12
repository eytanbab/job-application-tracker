# Job Application Tracker SaaS Feature Roadmap

This document lists the features and product work needed before Job Application Tracker is ready to operate as a SaaS product. It expands on `PLAN.md`, which is more sprint-oriented, and groups work by launch readiness.

## Product Positioning

### Core promise

- Help job seekers manage applications, documents, interviews, follow-ups, and outcomes in one place.
- Reduce manual tracking through import, reminders, AI extraction, and analytics.
- Turn job-search history into actionable insights: which roles, platforms, companies, salaries, and application habits produce results.

### Primary users

- Individual job seekers.
- Career switchers and bootcamp graduates.
- Recruiter-assisted candidates or career coaches, later as a team/business tier.

## Launch Readiness Checklist

### 1. Account, Auth, And User Lifecycle

- [ ] Public marketing homepage with clear positioning, pricing link, demo CTA, and sign-in/sign-up CTAs.
- [ ] Dedicated authenticated app shell separate from marketing pages.
- [ ] Clerk sign-up/sign-in flows reviewed for production copy, redirects, and error states.
- [ ] Guest mode limits and upgrade prompts.
- [ ] Guest-to-user migration for all user-owned data.
- [ ] Account settings page.
- [ ] Profile settings: name, email, timezone, preferred currency, job-search target.
- [ ] Data export from account settings.
- [ ] Account deletion flow.
- [ ] Delete account data from database and S3.
- [ ] Email verification enforcement for paid or persistent accounts.
- [ ] Session/device management if available through auth provider.

### 2. Billing And Plans

- [ ] Stripe integration or equivalent payment provider.
- [ ] Pricing page.
- [ ] Free plan limits.
- [ ] Pro plan.
- [ ] Optional coach/team plan later.
- [ ] Subscription checkout.
- [ ] Billing customer portal.
- [ ] Webhook handling for subscription state changes.
- [ ] Database model for plan, billing status, trial state, and usage limits.
- [ ] Usage gating for AI extraction, document storage, applications, exports, and integrations.
- [ ] Trial flow and trial expiration states.
- [ ] Grace period for failed payments.
- [ ] Clear upgrade prompts at limit boundaries.

### 3. Application Tracking

- [x] Canonical status model instead of pure free-text status.
- [x] Support custom statuses mapped to canonical categories.
- [ ] Status history table.
- [ ] Application timeline view.
- [ ] Notes per application.
- [ ] Interview notes per application.
- [ ] Contacts per application: recruiter, hiring manager, referral, interviewer.
- [ ] Follow-up date per application.
- [ ] Reminder date per application.
- [ ] Salary range fields: min, max, currency, period.
- [ ] Remote/hybrid/on-site field.
- [ ] Job source URL validation and normalization.
- [ ] Company domain field.
- [ ] Duplicate detection by company, role, and URL.
- [ ] Bulk select in applications table.
- [ ] Bulk status update.
- [ ] Bulk delete.
- [ ] Bulk archive.
- [ ] Archive instead of permanent delete for normal workflows.
- [ ] Restore archived applications.
- [ ] Advanced filters: status category, platform, company, role keyword, location, date range, salary range.
- [ ] Saved views.
- [ ] Kanban board with drag-and-drop status updates.
- [ ] Calendar/list view for interviews and follow-ups.
- [ ] Full application detail page.
- [ ] Quick-add modal.
- [ ] CSV import.
- [ ] CSV/XLSX export.
- [ ] Sample/demo data mode for new users.

### 4. Documents

- [ ] Document categories: resume, cover letter, portfolio, reference, transcript, other.
- [ ] Attach documents to applications.
- [ ] Mark a primary resume.
- [ ] Track which resume was used for each application.
- [ ] Upload progress and retry states.
- [ ] S3 object cleanup if metadata creation fails after upload.
- [ ] File size and storage usage display.
- [ ] Per-plan document storage limits.
- [ ] Rename document.
- [ ] Replace document file while preserving document record.
- [ ] Preview PDF in app.
- [ ] Virus/malware scanning for uploads before SaaS launch.
- [ ] Private S3 bucket enforcement.
- [ ] Short-lived signed URLs only.

### 5. AI Features

- [ ] AI extraction usage limits by plan.
- [ ] AI extraction quality states: success, partial success, needs review, failed.
- [ ] User confirmation step before saving extracted application data.
- [ ] Structured extraction schema validation.
- [ ] Retry extraction.
- [ ] Resume-to-job match score.
- [ ] Resume keyword gap analysis.
- [ ] Cover letter draft generation.
- [ ] Interview question generation from job description.
- [ ] Company research summary.
- [ ] Follow-up email draft generation.
- [ ] AI-generated application notes summary.
- [ ] AI cost tracking by user.
- [ ] Abuse prevention for extraction endpoint.
- [ ] Prompt/result logging policy that avoids storing sensitive content unnecessarily.

### 6. Reminders And Notifications

- [ ] In-app notification center.
- [ ] Follow-up reminders after configurable silence period.
- [ ] Interview reminders.
- [ ] Deadline reminders.
- [ ] Email notification preferences.
- [ ] Timezone-aware scheduled reminders.
- [ ] Background job runner or cron service.
- [ ] Notification delivery logs.
- [ ] Snooze reminders.
- [ ] Mark reminder complete.

### 7. Analytics

- [ ] Analytics date range filter across all analytics pages.
- [ ] AI Insights filters matching main analytics.
- [ ] Response rate by platform, company, role keyword, location, and weekday.
- [ ] Interview rate by platform, company, role keyword, location, and weekday.
- [ ] Offer rate.
- [ ] Rejection rate.
- [ ] Ghosting rate.
- [ ] Time to first response.
- [ ] Time to interview.
- [ ] Time to offer.
- [ ] Time to rejection.
- [ ] Active pipeline count by status category.
- [ ] Conversion funnel by canonical status.
- [ ] Salary analytics using structured salary fields.
- [ ] Trend comparisons over weeks/months.
- [ ] Export analytics charts/data.
- [ ] Empty states explaining what data is needed for each chart.
- [ ] Definitions/tooltips for metrics.

### 8. Integrations

- [ ] Google Calendar sync.
- [ ] Outlook Calendar sync.
- [ ] Gmail job-email detection.
- [ ] Outlook email detection.
- [ ] Chrome extension for clipping jobs.
- [ ] LinkedIn job URL extraction hardening.
- [ ] Greenhouse, Lever, Workday, Ashby, SmartRecruiters, Indeed URL handling.
- [ ] Zapier/Make webhook support later.
- [ ] Public API later for paid tiers.

### 9. Collaboration And Future Team Features

- [ ] Share application with read-only link.
- [ ] Share resume/document with expiring link.
- [ ] Coach view for invited advisor.
- [ ] Comments on application timeline.
- [ ] Team/workspace model later.
- [ ] Role-based access for team tier later.

### 10. UX And Product Polish

- [ ] Real dashboard landing page after sign-in.
- [ ] Onboarding checklist.
- [ ] First-run guided setup.
- [ ] Better status selector instead of raw text input.
- [ ] Comboboxes for company, platform, location, and role suggestions.
- [ ] Responsive table alternatives for mobile.
- [ ] Keyboard shortcuts for power users.
- [ ] Better loading, error, and empty states.
- [ ] Toast messages reviewed for consistent tone and capitalization.
- [ ] Destructive action confirmations reviewed.
- [ ] Accessibility audit.
- [ ] Mobile navigation polish.
- [ ] Dark mode visual QA.
- [ ] Consistent chart colors and legends.
- [ ] Product copy pass.

### 11. Security, Privacy, And Compliance

- [ ] Production environment variable audit.
- [ ] Server action authorization audit.
- [ ] Row ownership checks on every mutation and read.
- [ ] Rate limiting for API routes and expensive server actions.
- [ ] CSRF posture review for server actions.
- [ ] Input validation on every server action.
- [ ] URL validation and SSRF protection for scraping/extraction.
- [ ] Restrict scraper to HTTP/HTTPS and block private/internal IP ranges.
- [ ] Avoid logging raw AI responses, resumes, cover letters, and uploaded document content.
- [ ] Privacy policy.
- [ ] Terms of service.
- [ ] Cookie notice if required.
- [ ] Data retention policy.
- [ ] User data deletion process.
- [ ] Backups and restore plan.
- [ ] S3 bucket permissions audit.
- [ ] Security headers.
- [ ] Dependency vulnerability scanning.

### 12. Reliability And Operations

- [ ] Error monitoring with Sentry or equivalent.
- [ ] Product analytics with privacy-conscious event tracking.
- [ ] Structured server logs.
- [ ] Health check endpoint.
- [ ] Database migration workflow for production.
- [ ] Database backup verification.
- [ ] Background job monitoring.
- [ ] Uptime monitoring.
- [ ] Admin dashboard for support.
- [ ] Feature flags.
- [ ] Seed/demo data scripts.
- [ ] Staging environment.
- [ ] CI pipeline: lint, typecheck, build.
- [ ] E2E tests for critical flows.
- [ ] Unit tests for status classification, analytics calculations, salary parsing, and server actions.

### 13. Performance

- [ ] Index database columns used for filters: `user_id`, `date_applied`, `status`, `platform`, `company_name`, `year`, `month`.
- [ ] Pagination or server-side filtering for large application lists.
- [ ] Server-side document search if document counts grow.
- [ ] Avoid fetching all records for analytics once usage grows.
- [ ] Pre-aggregate analytics or use efficient SQL groupings.
- [ ] Optimize AI extraction timeout and cancellation behavior.
- [ ] Bundle analysis for client-heavy chart/table pages.
- [ ] Image and asset optimization for marketing pages.

## Suggested SaaS Milestones

### Milestone 1: Private Beta

- [ ] Canonical status model.
- [ ] Application detail page with notes and timeline.
- [ ] Follow-up reminders.
- [ ] Data export.
- [ ] Better onboarding.
- [ ] Error monitoring.
- [ ] Privacy policy and terms.
- [ ] Rate limiting for extraction.
- [ ] Critical unit tests.

### Milestone 2: Public Beta

- [ ] Pricing page.
- [ ] Stripe subscriptions.
- [ ] Plan limits.
- [ ] Billing portal.
- [ ] Document-to-application attachments.
- [ ] Resume/job match AI.
- [ ] Kanban board.
- [ ] Calendar view.
- [ ] E2E tests for sign-up, create application, upload document, AI extraction, and billing.

### Milestone 3: SaaS Launch

- [ ] Production marketing site.
- [ ] Account deletion and full data export.
- [ ] Support/admin tooling.
- [ ] Email notifications.
- [ ] Calendar sync.
- [ ] Security review.
- [ ] Backup/restore verification.
- [ ] Usage/cost monitoring for AI and storage.
- [ ] Launch analytics dashboard.

### Milestone 4: Growth

- [ ] Browser extension.
- [ ] Gmail/Outlook detection.
- [ ] Coach/advisor sharing.
- [ ] Public API or webhooks.
- [ ] Team/workspace tier.

## Highest-Impact Next Features

1. Canonical status model and status history.
2. Application detail page with notes, contacts, timeline, and follow-up date.
3. Reminder system for follow-ups and interviews.
4. Kanban board for pipeline management.
5. Export/import for user trust and portability.
6. Stripe billing and plan limits.
7. Security hardening for AI extraction and file uploads.
8. Error monitoring and E2E tests.

## Technical Debt To Resolve Before SaaS

- [x] Replace free-text-only status workflows with canonical status categories plus optional custom labels.
- [ ] Move repeated analytics logic into tested helper functions.
- [ ] Add tests for `getStatusKind`, analytics rates, salary parsing, and ghosting rules.
- [ ] Add database indexes for common filters and ownership queries.
- [ ] Add a real error boundary for app pages.
- [ ] Avoid production console logging of sensitive data.
- [ ] Review guest mode behavior and limits.
- [ ] Review all server actions for authorization and validation.
- [ ] Add production-safe file upload cleanup.
- [ ] Add CI checks.
