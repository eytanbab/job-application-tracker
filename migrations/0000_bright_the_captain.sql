CREATE TABLE "job_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role_name" text NOT NULL,
	"company_name" text NOT NULL,
	"date_applied" date NOT NULL,
	"link" text,
	"platform" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL
);
