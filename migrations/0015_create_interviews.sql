CREATE TABLE IF NOT EXISTS "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"round_type" varchar(64) NOT NULL,
	"round_label" varchar(255),
	"round_number" text DEFAULT '1' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"duration_mins" text DEFAULT '30',
	"timezone" varchar(64),
	"format" varchar(32) DEFAULT 'video' NOT NULL,
	"meeting_link" text,
	"location" text,
	"interviewer_name" varchar(255),
	"interviewer_title" varchar(255),
	"interviewer_linkedin" text,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL,
	"prep_notes" text,
	"questions_to_ask" text,
	"focus_areas" text,
	"sentiment" varchar(16),
	"debrief_notes" text,
	"questions_asked" text,
	"next_steps" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interviews_app_id_idx" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interviews_user_id_idx" ON "interviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "interviews_scheduled_idx" ON "interviews" USING btree ("user_id","scheduled_at");
