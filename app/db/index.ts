import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { documents, jobApplications, applicationStatusHistory } from "./schema";

export const isMockDb = !process.env.DATABASE_URL;

const schema = { jobApplications, documents, applicationStatusHistory };
const sql = neon(
  process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock",
);
const realDb = drizzle(sql, { schema });

export type AppDatabase = typeof realDb;

export const db: AppDatabase = isMockDb
  ? (new Proxy(
      {},
      {
        get(_, prop) {
          throw new Error(
            `Database operation '${String(prop)}' attempted without DATABASE_URL configured. When in mock mode, server actions should route to mockStore.`,
          );
        },
      },
    ) as unknown as AppDatabase)
  : realDb;

export { sql };

let ensureColumnPromise: Promise<void> | null = null;

export async function ensureResumeColumn() {
  if (isMockDb) return;
  if (!ensureColumnPromise) {
    ensureColumnPromise = (async () => {
      try {
        await sql`ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "resume_id" uuid;`;
      } catch (err) {
        console.warn("Could not add resume_id column to job_applications:", err);
      }
      try {
        await sql`ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "notes" text;`;
      } catch {}
      try {
        await sql`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_size" text;`;
      } catch {}
      try {
        await sql`ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" varchar(32) DEFAULT 'resume' NOT NULL;`;
      } catch {}
      try {
        await sql`
          DO $$ BEGIN
            ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_resume_id_documents_id_fk" 
            FOREIGN KEY ("resume_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `;
      } catch {}
      try {
        await sql`
          CREATE INDEX IF NOT EXISTS "job_apps_resume_id_idx" 
          ON "job_applications" USING btree ("resume_id");
        `;
      } catch {}
    })().catch((err) => {
      ensureColumnPromise = null;
      throw err;
    });
  }
  return ensureColumnPromise;
}
