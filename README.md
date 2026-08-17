# Job Application Tracker

A modern, high-performance job application tracking platform built with Next.js 16, React 19, Neon PostgreSQL, Drizzle ORM, Clerk Authentication, and Google Gemini AI. 

Easily manage job search pipelines, extract listing details in milliseconds via zero-AI deterministic parsers and sub-second Gemini AI fallback, track statuses and timeline history, upload resumes to Amazon S3, and analyze application metrics with interactive analytics dashboards.

---

## ✨ Features

- **⚡ Instant & AI-Powered Auto-Fill**:
  - **Zero-AI Fast Path (< 200ms)**: Dedicated deterministic parsers for major ATS platforms (**Greenhouse**, **Lever**, **Ashby**, **SmartRecruiters**, **Workable**, **Workday**) and job aggregators (**LinkedIn**, **Indeed**, **ZipRecruiter**, **Glassdoor**, **BambooHR**, **Breezy HR**, **Rippling**, **Jobvite**) using public APIs and Schema.org `JobPosting` JSON-LD.
  - **Sub-Second AI Fallback**: Automated fallback to Google Gemini (`gemini-2.5-flash-lite`) with structured outputs for unparsed or custom job pages.
- **📋 Full Pipeline Management**:
  - Track applications with canonical status categories (`applied`, `screen`, `interview`, `offer`, `rejected`, `withdrawn`) and custom status labels.
  - Timeline status history tracking changes over time.
  - Filter, search, and sort by company, role, platform, location, salary, date applied, and status.
  - Bulk select, bulk status update, and bulk delete operations.
- **📊 Analytics & Insights**:
  - **Overview**: Monthly application volume, active pipeline breakdowns, and conversion funnels.
  - **Status Per Platform**: Performance and outcome comparisons across LinkedIn, Indeed, Greenhouse, Company Websites, etc.
  - **AI Insights**: Detailed pipeline metrics and data-driven insights.
- **📁 Secure Document Storage**:
  - Upload, categorize, and manage resumes and cover letters backed by AWS S3.
- **🔐 Authentication & Guest Mode**:
  - Clerk authentication with seamless guest mode and automatic data migration upon sign-in.
- **🎨 Modern UI & Dark Mode**:
  - Built with Tailwind CSS v4, Radix UI primitives, shadcn/ui components, and `next-themes` dark/light mode toggle.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router with Turbopack), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
- **Database & ORM**: Serverless PostgreSQL via [Neon](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [Clerk](https://clerk.com/)
- **AI & Extraction**: [Google GenAI SDK](https://ai.google.dev/) (`@google/genai` with `gemini-2.5-flash-lite`), Schema.org JSON-LD
- **File Storage**: [Amazon S3](https://aws.amazon.com/s3/) (`@aws-sdk/client-s3`)
- **State & Tables**: [TanStack Table v8](https://tanstack.com/table/v8), [Nuqs](https://nuqs.47ng.com/) (URL search param state)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [drizzle-zod](https://orm.drizzle.team/docs/zod)
- **Charts**: [Recharts](https://recharts.org/)
- **Testing**: [Playwright](https://playwright.dev/) for E2E testing

---

## 📂 Project Structure

```text
├── app/
│   ├── (pages)/                  # App Router route groups
│   │   ├── analytics/            # Analytics dashboards & insights
│   │   ├── applications/         # Job applications table & filters
│   │   └── documents/            # Resume & document management
│   ├── _components/              # Shared client components (forms, sheets, nav)
│   ├── actions/                  # Next.js Server Actions (CRUD, analytics, documents)
│   ├── api/                      # API Route Handlers (/api/extract, etc.)
│   └── db/                       # Drizzle ORM schema & Neon client connection
├── components/                   # UI primitive components (shadcn/ui, Radix)
├── hooks/                        # Custom React hooks (toast, mobile detection)
├── lib/
│   ├── parsers/                  # Zero-AI deterministic job board extractors
│   │   ├── greenhouse.ts         # Greenhouse public API & DOM parser
│   │   ├── lever.ts              # Lever public API & DOM parser
│   │   ├── ashby.ts              # Ashby Next.js hydration & API parser
│   │   ├── smartrecruiters.ts    # SmartRecruiters public API parser
│   │   ├── workable.ts           # Workable widget API parser
│   │   ├── workday.ts            # Workday JSON-LD parser
│   │   ├── linkedin.ts           # LinkedIn DOM & JSON-LD parser
│   │   ├── indeed.ts             # Indeed JSON-LD & DOM parser
│   │   ├── jsonld.ts             # Universal Schema.org parser
│   │   └── index.ts              # Master deterministic parser router
│   ├── gemini.ts                 # Google GenAI client configuration
│   ├── s3-client.ts              # AWS S3 client & presigned URLs
│   ├── scraper.ts                # Production scraper with timeouts & fallbacks
│   └── utils.ts                  # Shared formatting & status helper utilities
├── migrations/                   # Drizzle database migration files
├── public/                       # Static assets
└── scripts/                      # Database migration & utility scripts
```

---

## 🛠️ Installation & Setup

### 1. Clone the repository

```sh
git clone https://github.com/eytanbab/job-application-tracker.git
cd job-application-tracker
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xyz.region.aws.neon.tech/neondb?sslmode=require

# Google Gemini AI
GEMINI_EXTRACTION_API_KEY=AIzaSy...   # For job posting scraping & extraction
GEMINI_ATS_API_KEY=AIzaSy...          # For ATS Resume Compatibility & bullet optimization

# AWS S3 (For resume & document storage)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 4. Run Database Migrations

Generate and apply database migrations using Drizzle:

```sh
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 5. Start the Development Server

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🧪 Testing & Verification

- **Type Check**:
  ```sh
  npx tsc --noEmit
  ```
- **Build Verification**:
  ```sh
  npm run build
  ```
- **End-to-End Tests**:
  ```sh
  npm run test:e2e
  ```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
