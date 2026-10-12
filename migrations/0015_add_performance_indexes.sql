CREATE INDEX IF NOT EXISTS "job_apps_user_status_cat_idx" ON "job_applications" USING btree ("user_id", "status_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "status_history_app_created_idx" ON "application_status_history" USING btree ("application_id", "created_at");
