import {
  pgTable,
  varchar,
  text,
  date,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";

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
  },
  (table) => [
    index("job_apps_user_id_idx").on(table.userId),
    index("job_apps_user_date_idx").on(table.userId, table.date_applied),
    index("job_apps_user_period_idx").on(table.userId, table.year, table.month),
  ],
);

export const insertApplicationSchema = createInsertSchema(jobApplications);

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
  ],
);

export const insertStatusHistorySchema = createInsertSchema(applicationStatusHistory);

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => jobApplications.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 }).notNull(),
    roundType: varchar("round_type", { length: 64 }).notNull(), // phone_screen, technical, behavioral, take_home, onsite, hiring_manager, final, other
    roundLabel: varchar("round_label", { length: 255 }), // custom label e.g. "System Design Round"
    roundNumber: text("round_number").notNull().default("1"), // numeric order stored as text/int
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    durationMins: text("duration_mins").default("30"),
    timezone: varchar("timezone", { length: 64 }),
    format: varchar("format", { length: 32 }).default("video").notNull(), // video, phone, onsite
    meetingLink: text("meeting_link"),
    location: text("location"),
    interviewerName: varchar("interviewer_name", { length: 255 }),
    interviewerTitle: varchar("interviewer_title", { length: 255 }),
    interviewerLinkedin: text("interviewer_linkedin"),
    status: varchar("status", { length: 32 }).default("scheduled").notNull(), // scheduled, completed, cancelled, rescheduled, no_show
    prepNotes: text("prep_notes"),
    questionsToAsk: text("questions_to_ask"),
    focusAreas: text("focus_areas"),
    sentiment: varchar("sentiment", { length: 16 }), // 'great' | 'okay' | 'rough' or numeric '1'..'5'
    debriefNotes: text("debrief_notes"),
    questionsAsked: text("questions_asked"),
    nextSteps: text("next_steps"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("interviews_app_id_idx").on(table.applicationId),
    index("interviews_user_id_idx").on(table.userId),
    index("interviews_scheduled_idx").on(table.userId, table.scheduledAt),
  ],
);

export const insertInterviewSchema = createInsertSchema(interviews);
