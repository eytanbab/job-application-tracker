import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import dotenv from "dotenv";
import path from "path";
import { like, or } from "drizzle-orm";
import { jobApplications } from "../app/db/schema";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) {
    console.warn("No DATABASE_URL found in process.env for globalTeardown.");
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log("Cleaning up test applications from e2e database...");
    const result = await db
      .delete(jobApplications)
      .where(
        or(
          like(jobApplications.role_name, "QA Engineer%"),
          like(jobApplications.role_name, "Test Software Engineer%"),
          like(jobApplications.company_name, "TechCorp%"),
          like(jobApplications.company_name, "Test Company%")
        )
      );

    console.log("Database cleanup completed successfully.");
  } catch (error) {
    console.error("Error cleaning up database in globalTeardown:", error);
  }
}
