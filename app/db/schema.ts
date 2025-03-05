import {
  pgTable,
  varchar,
  text,
  date,
  uuid,
  timestamp,
} from 'drizzle-orm/pg-core';

import { createInsertSchema } from 'drizzle-zod';

export const jobApplications = pgTable('job_applications', {
  id: uuid().defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Clerk user ID
  role_name: text('role_name').notNull(),
  company_name: text('company_name').notNull(),
  date_applied: date('date_applied').notNull(),
  link: text('link').notNull(),
  platform: varchar('platform', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
  month: varchar('month').notNull(),
  year: varchar('year').notNull(),
  description: text('description'),
  location: text('location').notNull(),
});

export const insertApplicationSchema = createInsertSchema(jobApplications);

export const documents = pgTable('documents', {
  id: uuid().defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title').notNull(),
  doc_url: varchar('doc_url').notNull(),
  created_at: timestamp().defaultNow().notNull(),
  file_name: varchar('file_name').notNull(),
});
