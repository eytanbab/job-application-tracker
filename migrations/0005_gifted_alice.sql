ALTER TABLE "job_applications" ALTER COLUMN "month" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "month" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "year" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "job_applications" ALTER COLUMN "location" SET NOT NULL;