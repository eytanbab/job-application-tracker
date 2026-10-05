import { subDays } from "date-fns";

export interface MockDocument {
  id: string;
  userId: string;
  title: string;
  category: string;
  file_size: string | null;
  doc_url: string;
  created_at: Date;
  file_name: string;
  file_key: string;
}

const now = new Date();

export const SEED_DOCUMENTS: MockDocument[] = [
  {
    id: "doc-mock-001",
    userId: "mock-dev-user",
    title: "Senior Full Stack Resume 2026",
    category: "resume",
    file_size: "142 KB",
    doc_url: "https://mock-storage.local/documents/resume-fullstack-2026.pdf",
    created_at: subDays(now, 15),
    file_name: "Senior_FullStack_Engineer_2026.pdf",
    file_key: "mock-dev-user/resume-fullstack-2026.pdf",
  },
  {
    id: "doc-mock-002",
    userId: "mock-dev-user",
    title: "Frontend & UI Systems Specialist Resume",
    category: "resume",
    file_size: "128 KB",
    doc_url: "https://mock-storage.local/documents/resume-frontend-design-systems.pdf",
    created_at: subDays(now, 28),
    file_name: "Frontend_Design_Systems_Resume.pdf",
    file_key: "mock-dev-user/resume-frontend-design-systems.pdf",
  },
  {
    id: "doc-mock-003",
    userId: "mock-dev-user",
    title: "Vercel Tailored Cover Letter",
    category: "cover_letter",
    file_size: "86 KB",
    doc_url: "https://mock-storage.local/documents/cover-letter-vercel.pdf",
    created_at: subDays(now, 14),
    file_name: "Cover_Letter_Vercel_Senior_FE.pdf",
    file_key: "mock-dev-user/cover-letter-vercel.pdf",
  },
  {
    id: "doc-mock-004",
    userId: "mock-dev-user",
    title: "General Tech Leadership Cover Letter",
    category: "cover_letter",
    file_size: "92 KB",
    doc_url: "https://mock-storage.local/documents/cover-letter-tech-lead.pdf",
    created_at: subDays(now, 45),
    file_name: "General_Tech_Lead_CoverLetter.pdf",
    file_key: "mock-dev-user/cover-letter-tech-lead.pdf",
  },
];
