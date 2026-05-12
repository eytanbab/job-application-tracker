ALTER TABLE "job_applications" ADD COLUMN "status_category" varchar(32) DEFAULT 'applied' NOT NULL;
ALTER TABLE "job_applications" ADD COLUMN "status_label" varchar(255);

UPDATE "job_applications"
SET
  "status_category" = CASE
    WHEN lower("status") LIKE '%ghost%' THEN 'ghosted'
    WHEN lower("status") LIKE '%reject%' THEN 'rejected'
    WHEN lower("status") LIKE '%accept%' OR lower("status") LIKE '%offer%' THEN 'accepted'
    WHEN lower("status") LIKE '%interview%' THEN 'interview'
    WHEN lower("status") LIKE '%review%' THEN 'review'
    WHEN lower("status") LIKE '%applied%' THEN 'applied'
    ELSE 'other'
  END,
  "status_label" = CASE
    WHEN lower("status") IN ('applied', 'ghosted', 'rejected', 'accepted', 'interview', 'review', 'other') THEN NULL
    ELSE "status"
  END;
