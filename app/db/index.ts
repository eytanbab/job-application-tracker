import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { documents, jobApplications } from './schema';

console.log('DATABASE URL: ', process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon postgres connection string');
}
const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  schema: { jobApplications, documents },
});
