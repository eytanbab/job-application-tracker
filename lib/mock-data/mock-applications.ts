import { subDays, format } from "date-fns";

export interface MockApplication {
  id: string;
  userId: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
  statusCategory: string;
  month: string;
  year: string;
  description: string | null;
  notes: string | null;
  location: string;
  createdAt: Date;
  salary: string | null;
  resumeId?: string | null;
}

export interface MockStatusHistory {
  id: string;
  applicationId: string;
  status: string;
  statusCategory: string;
  createdAt: Date;
}

const now = new Date();
const currentYear = now.getFullYear().toString();

function makeDate(daysAgo: number): { str: string; date: Date; month: string; year: string } {
  const d = subDays(now, daysAgo);
  return {
    str: format(d, "yyyy-MM-dd"),
    date: d,
    month: format(d, "M"),
    year: format(d, "yyyy"),
  };
}

export const SEED_APPLICATIONS: MockApplication[] = [
  {
    id: "app-mock-001",
    userId: "mock-dev-user",
    role_name: "Senior Frontend Engineer",
    company_name: "Vercel",
    ...(() => {
      const d = makeDate(14);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://vercel.com/careers/senior-frontend-engineer",
    platform: "company website",
    status: "Technical Screen",
    statusCategory: "interview",
    salary: "$180,000 - $220,000",
    location: "Remote (US)",
    description:
      "Vercel is looking for a Senior Frontend Engineer to build world-class developer experiences for Next.js, Turbopack, and the Vercel Dashboard.\n\nResponsibilities:\n- Architect high-performance React and Next.js applications.\n- Optimize core Web Vitals, SSR latency, and client-side hydration.\n- Collaborate closely with product design and open-source engineers.\n\nRequirements:\n- 5+ years of production experience with TypeScript, React, and Next.js.\n- Deep understanding of modern browser APIs and rendering pipelines.\n- Passion for developer velocity and clean ergonomics.",
    notes:
      "Referred by Sarah Jenkins from the Next.js team. Completed initial recruiter chat on Monday; technical screening with Staff Engineer scheduled for Thursday 2 PM EST.",
    resumeId: "doc-mock-001",
  },
  {
    id: "app-mock-002",
    userId: "mock-dev-user",
    role_name: "Staff Infrastructure Engineer",
    company_name: "Stripe",
    ...(() => {
      const d = makeDate(21);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://stripe.com/jobs/staff-infrastructure",
    platform: "linkedin",
    status: "Applied",
    statusCategory: "applied",
    salary: "$240,000 - $290,000",
    location: "San Francisco, CA (Hybrid)",
    description:
      "Join the Stripe Global Infrastructure foundation. You will own the distributed compute and service mesh powering hundreds of billions in financial velocity.\n\nQualifications:\n- 7+ years building resilient distributed systems in Go, Rust, or Java.\n- Deep experience with Kubernetes, eBPF, and global traffic routing.\n- Track record of leading high-stakes reliability initiatives.",
    notes: "Applied via LinkedIn Easy Apply. Reached out to Engineering Manager Dave Kowalski on LinkedIn.",
  },
  {
    id: "app-mock-003",
    userId: "mock-dev-user",
    role_name: "Product Engineer (Design Systems)",
    company_name: "Figma",
    ...(() => {
      const d = makeDate(10);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://figma.com/careers/product-engineer",
    platform: "greenhouse",
    status: "Under Review",
    statusCategory: "review",
    salary: "$190,000 - $230,000",
    location: "San Francisco, CA",
    description:
      "Figma is looking for a Product Engineer to craft component architecture, design token synchronization, and canvas UI primitives.\n\nRequirements:\n- Mastery of WebGL/Canvas and DOM composition.\n- Extensive experience building accessible design systems.\n- Strong eye for micro-interactions and motion design.",
    notes: "Confirmation email received from Figma Greenhouse. Application under active recruiter review.",
    resumeId: "doc-mock-002",
  },
  {
    id: "app-mock-004",
    userId: "mock-dev-user",
    role_name: "Full Stack Engineer (AI Products)",
    company_name: "OpenAI",
    ...(() => {
      const d = makeDate(16);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://openai.com/careers/full-stack-engineer",
    platform: "greenhouse",
    status: "System Design Interview",
    statusCategory: "interview",
    salary: "$220,000 - $280,000",
    location: "San Francisco, CA (In-Office)",
    description:
      "Build the web interfaces, developer toolchains, and real-time streaming architectures powering ChatGPT and the OpenAI API.\n\nSkills:\n- React, TypeScript, Python, FastAPI, WebSockets.\n- Experience designing resilient streaming state management.",
    notes:
      "Passed HackerRank coding assessment with 100% score. System design interview scheduled with Tech Lead next Tuesday.",
    resumeId: "doc-mock-001",
  },
  {
    id: "app-mock-005",
    userId: "mock-dev-user",
    role_name: "Senior UI Engineer",
    company_name: "Airbnb",
    ...(() => {
      const d = makeDate(65);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://airbnb.com/careers/senior-ui",
    platform: "linkedin",
    status: "Offer Extended",
    statusCategory: "accepted",
    salary: "$210,000 + Equity",
    location: "Remote",
    description:
      "Lead frontend architecture on Airbnb's core Guest Experience team, building high-conversion booking flows with modern TypeScript and GraphQL.",
    notes:
      "Formal written offer received! $210k base salary, $80k annual RSUs, and $25k sign-on bonus. Decision deadline in 2 weeks.",
  },
  {
    id: "app-mock-006",
    userId: "mock-dev-user",
    role_name: "Full Stack Developer",
    company_name: "Datadog",
    ...(() => {
      const d = makeDate(8);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://datadog.com/careers/full-stack",
    platform: "indeed",
    status: "Applied",
    statusCategory: "applied",
    salary: "$175,000 - $215,000",
    location: "New York, NY",
    description:
      "Join Datadog's APM Visualization team to build real-time tracing graphs, distributed flamegraphs, and high-throughput monitoring dashboards.",
    notes: "Applied via Indeed. Sent follow-up note to recruiter on Day 7.",
  },
  {
    id: "app-mock-007",
    userId: "mock-dev-user",
    role_name: "Systems Engineer (Workers Platform)",
    company_name: "Cloudflare",
    ...(() => {
      const d = makeDate(9);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://cloudflare.com/careers/systems-engineer",
    platform: "lever",
    status: "Recruiter Screen",
    statusCategory: "interview",
    salary: "$185,000 - $215,000",
    location: "Austin, TX (Hybrid)",
    description:
      "Cloudflare Workers provides a serverless execution environment at global edge locations. Work on V8 isolates, WebAssembly runtimes, and fast routing.",
    notes: "Recruiter phone screen scheduled for Wednesday 11 AM CT. Reviewed V8 Isolate architecture in preparation.",
  },
  {
    id: "app-mock-008",
    userId: "mock-dev-user",
    role_name: "Product Engineer",
    company_name: "Linear",
    ...(() => {
      const d = makeDate(20);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://linear.app/careers/product-engineer",
    platform: "company website",
    status: "Take-Home Project",
    statusCategory: "interview",
    salary: "$175,000 - $205,000",
    location: "Remote",
    description:
      "Build high-performance keyboard-first developer tools with sync engines, optimistic updates, and localized IndexedDB caching.",
    notes:
      "Received the take-home assignment: build an offline-first issue queue with conflict resolution. Spent 4 hours, clean code with tests.",
  },
  {
    id: "app-mock-009",
    userId: "mock-dev-user",
    role_name: "Senior Backend Developer",
    company_name: "Shopify",
    ...(() => {
      const d = makeDate(35);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://shopify.com/careers/backend-dev",
    platform: "greenhouse",
    status: "Position Filled",
    statusCategory: "rejected",
    salary: "$165,000 - $190,000",
    location: "Remote (Americas)",
    description:
      "Scale Shopify's Storefront API and Flash Sale checkout pipeline handling millions of requests per second during Black Friday Cyber Monday.",
    notes: "Completed final interview loop. Rejection email received stating team prioritized candidate with deep Ruby on Rails internals.",
  },
  {
    id: "app-mock-010",
    userId: "mock-dev-user",
    role_name: "Distributed Systems Engineer",
    company_name: "Netflix",
    ...(() => {
      const d = makeDate(42);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://netflix.com/jobs/distributed-systems",
    platform: "linkedin",
    status: "Ghosted",
    statusCategory: "ghosted",
    salary: "$300,000 - $350,000",
    location: "Los Gatos, CA",
    description:
      "Design and maintain the edge routing fabric and content delivery orchestration supporting over 260 million global streaming members.",
    notes: "Applied 42 days ago. Sent 2 follow-ups to recruiter via email and LinkedIn with zero response.",
  },
  {
    id: "app-mock-011",
    userId: "mock-dev-user",
    role_name: "Frontend Architect",
    company_name: "Uber",
    ...(() => {
      const d = makeDate(50);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://uber.com/careers/frontend-architect",
    platform: "linkedin",
    status: "Not Selected",
    statusCategory: "rejected",
    salary: "$230,000 - $275,000",
    location: "Seattle, WA",
    description:
      "Standardize cross-platform web micro-frontends across Uber Rides, Eats, and Freight with strict performance budgets.",
    notes: "Automated rejection received after 3 weeks. No feedback provided.",
  },
  {
    id: "app-mock-012",
    userId: "mock-dev-user",
    role_name: "Full Stack Engineer (Workplace AI)",
    company_name: "Notion",
    ...(() => {
      const d = makeDate(38);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://notion.so/careers/full-stack-ai",
    platform: "greenhouse",
    status: "Ghosted",
    statusCategory: "ghosted",
    salary: "$180,000 - $210,000",
    location: "San Francisco, CA",
    description:
      "Build connected workspace intelligence, collaborative block editing, and RAG document QA search inside Notion.",
    notes: "Application submitted over a month ago. No acknowledgment or recruiter contact received.",
  },
  {
    id: "app-mock-013",
    userId: "mock-dev-user",
    role_name: "Database Backend Engineer",
    company_name: "Supabase",
    ...(() => {
      const d = makeDate(3);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://supabase.com/careers/backend-engineer",
    platform: "wellfound",
    status: "Applied",
    statusCategory: "applied",
    salary: "$165,000 - $195,000",
    location: "Remote (Global)",
    description:
      "Build open source backend services around PostgreSQL, Realtime Elixir websockets, and automated cloud clustering.",
    notes: "Applied via Wellfound. Highlighted open source contributions to Drizzle ORM and Neon drivers.",
  },
  {
    id: "app-mock-014",
    userId: "mock-dev-user",
    role_name: "Staff Platform Engineer",
    company_name: "GitHub",
    ...(() => {
      const d = makeDate(12);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://github.com/careers/staff-platform",
    platform: "indeed",
    status: "Resume Review",
    statusCategory: "review",
    salary: "$195,000 - $235,000",
    location: "Remote (US)",
    description:
      "Architect CI/CD runtime sandboxes, Actions execution engines, and security containerization for 100M+ developers.",
    notes: "Application status in Microsoft careers portal changed to 'Under Recruiter Review' 3 days ago.",
  },
  {
    id: "app-mock-015",
    userId: "mock-dev-user",
    role_name: "Full Stack Engineer (Tooling)",
    company_name: "Anthropic",
    ...(() => {
      const d = makeDate(5);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://anthropic.com/careers/full-stack-tooling",
    platform: "lever",
    status: "Applied",
    statusCategory: "applied",
    salary: "$210,000 - $260,000",
    location: "San Francisco, CA",
    description:
      "Create high-velocity research tooling, evaluation playgrounds, and human-in-the-loop interfaces for Frontier model alignment.",
    notes: "Submitted tailored application highlighting model eval dashboards and React Canvas visualization work.",
  },
  {
    id: "app-mock-016",
    userId: "mock-dev-user",
    role_name: "Senior Client Engineer (Web)",
    company_name: "Discord",
    ...(() => {
      const d = makeDate(17);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://discord.com/jobs/senior-client-engineer",
    platform: "greenhouse",
    status: "Technical Loop",
    statusCategory: "interview",
    salary: "$185,000 - $225,000",
    location: "San Francisco, CA (Hybrid)",
    description:
      "Optimize Discord's React desktop & web client for millions of concurrent voice, video, and text gamers. WebRTC & React internals.",
    notes: "Completed 1st round coding interview. Virtual on-site scheduled for Friday (4 rounds: System Design, Coding, Team Fit).",
  },
  {
    id: "app-mock-017",
    userId: "mock-dev-user",
    role_name: "Senior Frontend Developer",
    company_name: "Canva",
    ...(() => {
      const d = makeDate(11);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://canva.com/careers/senior-frontend",
    platform: "indeed",
    status: "Initial Screen",
    statusCategory: "interview",
    salary: "$160,000 - $185,000",
    location: "Remote (US)",
    description:
      "Join the Visual Suite team to enhance graphic collaboration tools, real-time multi-cursor editing, and rich SVG export rendering.",
    notes: "Recruiter phone call went great. Discussed SVG optimization and performance profiling experience.",
  },
  {
    id: "app-mock-018",
    userId: "mock-dev-user",
    role_name: "Full Stack Developer",
    company_name: "PostHog",
    ...(() => {
      const d = makeDate(2);
      return { date_applied: d.str, month: d.month, year: d.year, createdAt: d.date };
    })(),
    link: "https://posthog.com/careers/full-stack",
    platform: "wellfound",
    status: "Applied",
    statusCategory: "applied",
    salary: "$160,000 - $180,000",
    location: "Remote (Global)",
    description:
      "Build open-source product analytics, session replay, and feature flag management in TypeScript, React, and Django.",
    notes: "Completed the PostHog public culture quiz and submitted application with GitHub profile.",
  },
];

export const SEED_STATUS_HISTORY: MockStatusHistory[] = [
  // Vercel (interview)
  {
    id: "hist-001",
    applicationId: "app-mock-001",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 14),
  },
  {
    id: "hist-002",
    applicationId: "app-mock-001",
    status: "In Review",
    statusCategory: "review",
    createdAt: subDays(now, 11),
  },
  {
    id: "hist-003",
    applicationId: "app-mock-001",
    status: "Technical Screen",
    statusCategory: "interview",
    createdAt: subDays(now, 5),
  },

  // Stripe (applied)
  {
    id: "hist-004",
    applicationId: "app-mock-002",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 21),
  },

  // Figma (review)
  {
    id: "hist-005",
    applicationId: "app-mock-003",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 10),
  },
  {
    id: "hist-006",
    applicationId: "app-mock-003",
    status: "Under Review",
    statusCategory: "review",
    createdAt: subDays(now, 4),
  },

  // OpenAI (interview)
  {
    id: "hist-007",
    applicationId: "app-mock-004",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 16),
  },
  {
    id: "hist-008",
    applicationId: "app-mock-004",
    status: "Online Assessment",
    statusCategory: "interview",
    createdAt: subDays(now, 12),
  },
  {
    id: "hist-009",
    applicationId: "app-mock-004",
    status: "System Design Interview",
    statusCategory: "interview",
    createdAt: subDays(now, 3),
  },

  // Airbnb (accepted / offer)
  {
    id: "hist-010",
    applicationId: "app-mock-005",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 65),
  },
  {
    id: "hist-011",
    applicationId: "app-mock-005",
    status: "Recruiter Screen",
    statusCategory: "interview",
    createdAt: subDays(now, 55),
  },
  {
    id: "hist-012",
    applicationId: "app-mock-005",
    status: "Technical Onsite",
    statusCategory: "interview",
    createdAt: subDays(now, 30),
  },
  {
    id: "hist-013",
    applicationId: "app-mock-005",
    status: "Offer Extended",
    statusCategory: "accepted",
    createdAt: subDays(now, 5),
  },

  // Shopify (rejected)
  {
    id: "hist-014",
    applicationId: "app-mock-009",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 35),
  },
  {
    id: "hist-015",
    applicationId: "app-mock-009",
    status: "Technical Screen",
    statusCategory: "interview",
    createdAt: subDays(now, 25),
  },
  {
    id: "hist-016",
    applicationId: "app-mock-009",
    status: "Position Filled",
    statusCategory: "rejected",
    createdAt: subDays(now, 15),
  },

  // Netflix (ghosted)
  {
    id: "hist-017",
    applicationId: "app-mock-010",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 42),
  },
  {
    id: "hist-018",
    applicationId: "app-mock-010",
    status: "Ghosted",
    statusCategory: "ghosted",
    createdAt: subDays(now, 10),
  },

  // Discord (interview)
  {
    id: "hist-019",
    applicationId: "app-mock-016",
    status: "Applied",
    statusCategory: "applied",
    createdAt: subDays(now, 17),
  },
  {
    id: "hist-020",
    applicationId: "app-mock-016",
    status: "Initial Screen",
    statusCategory: "interview",
    createdAt: subDays(now, 10),
  },
  {
    id: "hist-021",
    applicationId: "app-mock-016",
    status: "Technical Loop",
    statusCategory: "interview",
    createdAt: subDays(now, 2),
  },
];
