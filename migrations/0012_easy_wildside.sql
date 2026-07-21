CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"status" varchar(255) NOT NULL,
	"status_category" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "status_category" varchar(32) DEFAULT 'applied' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "status_label" varchar(255);--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "salary" text;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;