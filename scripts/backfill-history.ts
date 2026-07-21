import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon postgres connection string');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Relative import to avoid tsconfig path alias issues
import { jobApplications, applicationStatusHistory } from '../app/db/schema';

async function main() {
  console.log('Fetching all job applications...');
  const apps = await db.select().from(jobApplications);
  console.log(`Found ${apps.length} total applications.`);

  if (apps.length === 0) {
    console.log('No applications to backfill.');
    return;
  }

  console.log('Fetching existing status history records...');
  const history = await db.select({ applicationId: applicationStatusHistory.applicationId }).from(applicationStatusHistory);
  const appsWithHistory = new Set(history.map(h => h.applicationId));
  console.log(`Found ${appsWithHistory.size} applications that already have history.`);

  const appsToBackfill = apps.filter(app => !appsWithHistory.has(app.id));
  console.log(`Need to backfill history for ${appsToBackfill.length} applications.`);

  if (appsToBackfill.length === 0) {
    console.log('All applications already have history records. Nothing to do.');
    return;
  }

  // Insert history records
  console.log('Inserting initial history records...');
  
  const valuesToInsert = appsToBackfill.map(app => ({
    applicationId: app.id,
    status: app.status,
    statusCategory: app.statusCategory,
    createdAt: app.createdAt,
  }));

  // Drizzle allows batch insert
  await db.insert(applicationStatusHistory).values(valuesToInsert);
  console.log(`Successfully backfilled ${valuesToInsert.length} status history records!`);
}

main().catch(err => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
