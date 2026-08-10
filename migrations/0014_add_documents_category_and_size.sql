ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "category" varchar(32) DEFAULT 'resume' NOT NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "file_size" text;
