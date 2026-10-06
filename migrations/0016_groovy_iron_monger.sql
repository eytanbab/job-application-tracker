ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" varchar(32) DEFAULT 'resume' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_size" text;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "notes" text;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN IF NOT EXISTS "resume_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_resume_id_documents_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_history_app_id_idx" ON "application_status_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_history_app_created_idx" ON "application_status_history" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_apps_user_id_idx" ON "job_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_apps_user_date_idx" ON "job_applications" USING btree ("user_id","date_applied");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_apps_user_period_idx" ON "job_applications" USING btree ("user_id","year","month");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_apps_user_status_cat_idx" ON "job_applications" USING btree ("user_id","status_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "job_apps_resume_id_idx" ON "job_applications" USING btree ("resume_id");--> statement-breakpoint
ALTER TABLE "job_applications" DROP COLUMN IF EXISTS "status_label";