import {
  pgTable,
  varchar,
  text,
  date,
  uuid,
  timestamp,
  index,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: varchar("title").notNull(),
    category: varchar("category", { length: 32 }).default("resume").notNull(),
    file_size: text("file_size"),
    doc_url: varchar("doc_url").notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    file_name: varchar("file_name").notNull(),
    file_key: varchar("file_key").notNull(),
  },
  (table) => [
    index("documents_user_id_idx").on(table.userId),
  ],
);

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(), // Clerk user ID
    role_name: text("role_name").notNull(),
    company_name: text("company_name").notNull(),
    date_applied: date("date_applied").notNull(),
    link: text("link").notNull(),
    platform: varchar("platform", { length: 255 }).notNull(),
    status: varchar("status", { length: 255 }).notNull(),
    statusCategory: varchar("status_category", { length: 32 })
      .default("applied")
      .notNull(),
    month: varchar("month").notNull(),
    year: varchar("year").notNull(),
    description: text("description"),
    notes: text("notes"),
    location: text("location").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    salary: text("salary"),
    resumeId: uuid("resume_id").references(() => documents.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("job_apps_user_id_idx").on(table.userId),
    index("job_apps_user_date_idx").on(table.userId, table.date_applied),
    index("job_apps_user_period_idx").on(table.userId, table.year, table.month),
    index("job_apps_user_status_cat_idx").on(table.userId, table.statusCategory),
    index("job_apps_resume_id_idx").on(table.resumeId),
  ],
);

export const insertApplicationSchema = createInsertSchema(jobApplications);

export const applicationStatusHistory = pgTable(
  "application_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => jobApplications.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 255 }).notNull(),
    statusCategory: varchar("status_category", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("status_history_app_id_idx").on(table.applicationId),
    index("status_history_app_created_idx").on(
      table.applicationId,
      table.createdAt,
    ),
  ],
);

const insertStatusHistorySchema = createInsertSchema(applicationStatusHistory);

// One row per user (or guest id) for settings that change what analytics
// shows. Typed columns, so each new preference is a migration, not a blob.
export const userPreferences = pgTable("user_preferences", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  // Applications per week the user aims for; null means no goal.
  weeklyApplicationGoal: integer("weekly_application_goal"),
  // ISO 4217 code for salary figures; null means use the most common one.
  salaryCurrency: varchar("salary_currency", { length: 3 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Per-user daily counters for paid AI calls (Gemini). One row per user,
// feature and UTC day; incremented with an atomic upsert in lib/ai-usage.ts.
export const aiUsage = pgTable(
  "ai_usage",
  {
    userId: varchar("user_id", { length: 255 }).notNull(),
    feature: varchar("feature", { length: 32 }).notNull(),
    day: date("day", { mode: "string" }).notNull(),
    count: integer("count").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.feature, table.day] })],
);
