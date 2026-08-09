import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not found in environment");
  process.exit(1);
}

const sql = neon(dbUrl);

async function migrate() {
  console.log("Consolidating status/notes and dropping status_label/status_notes columns...");
  try {
    // If status_label has data, copy it to status where status is empty or generic
    await sql`
      UPDATE "job_applications"
      SET "status" = "status_label"
      WHERE "status_label" IS NOT NULL AND "status_label" != '';
    `;
    // If status_notes has data, merge it into notes
    await sql`
      UPDATE "job_applications"
      SET "notes" = COALESCE("notes", '') || CASE WHEN "notes" IS NOT NULL AND "notes" != '' THEN E'\n' ELSE '' END || "status_notes"
      WHERE "status_notes" IS NOT NULL AND "status_notes" != '';
    `;
    // Drop status_label and status_notes columns
    await sql`ALTER TABLE "job_applications" DROP COLUMN IF EXISTS "status_label";`;
    await sql`ALTER TABLE "job_applications" DROP COLUMN IF EXISTS "status_notes";`;
    console.log("Successfully migrated database and removed status_label & status_notes!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
