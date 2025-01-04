import { pgTable, serial, varchar, text, date } from 'drizzle-orm/pg-core';

export const jobApplications = pgTable('job_applications', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), // Clerk user ID
  roleName: text('role_name').notNull(),
  companyName: text('company_name').notNull(),
  dateApplied: date('date_applied').notNull(),
  link: text('link'),
  platform: varchar('platform', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull(),
});
