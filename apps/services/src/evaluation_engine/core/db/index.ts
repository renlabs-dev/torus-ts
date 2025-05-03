import * as schema from "@torus-ts/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Cache the database connection in development. This avoids creating a new
 * connection on every HMR update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export function createDb() {
  // eslint-disable-next-line no-restricted-properties
  const conn = globalForDb.conn ?? postgres(String(process.env.POSTGRES_URL));
  // eslint-disable-next-line no-restricted-properties
  if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;
  const db = drizzle(conn, { schema });
  return db;
}
export type DB = ReturnType<typeof createDb>;
