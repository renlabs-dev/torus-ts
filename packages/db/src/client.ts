import * as schema from "@torus-ts/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

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

export function createDbGeneric<T extends Record<string, unknown>>(
  schema: T,
): PostgresJsDatabase<T> {
  // Get or create the connection
  // eslint-disable-next-line no-restricted-properties
  const conn = globalForDb.conn ?? postgres(String(process.env.POSTGRES_URL));

  // eslint-disable-next-line no-restricted-properties
  if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

  return drizzle(conn, { schema }) as PostgresJsDatabase<T>;
}
