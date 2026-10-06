import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { documents, jobApplications, applicationStatusHistory } from "./schema";

export const isMockDb = !process.env.DATABASE_URL;

const schema = { jobApplications, documents, applicationStatusHistory };
const sql = neon(
  process.env.DATABASE_URL || "postgresql://mock:mock@localhost:5432/mock",
);
const realDb = drizzle(sql, { schema });

export type AppDatabase = typeof realDb;

export const db: AppDatabase = isMockDb
  ? (new Proxy(
      {},
      {
        get(_, prop) {
          throw new Error(
            `Database operation '${String(prop)}' attempted without DATABASE_URL configured. When in mock mode, server actions should route to mockStore.`,
          );
        },
      },
    ) as unknown as AppDatabase)
  : realDb;

