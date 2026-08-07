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
  console.log("Adding 'notes' and 'status_notes' columns to 'job_applications' table...");
  try {
    await sql`ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "notes" text;`;
    console.log("Added column 'notes'");
    await sql`ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "status_notes" text;`;
    console.log("Added column 'status_notes'");
    console.log("Database migration successful!");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
