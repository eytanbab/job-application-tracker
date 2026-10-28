ALTER TABLE "job_applications" ADD COLUMN "follow_up_date" date;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "interview_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "contact_name" text;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "referred_by" text;