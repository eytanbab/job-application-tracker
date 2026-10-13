CREATE TABLE "ai_usage" (
	"user_id" varchar(255) NOT NULL,
	"feature" varchar(32) NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_user_id_feature_day_pk" PRIMARY KEY("user_id","feature","day")
);
