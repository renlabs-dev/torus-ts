import * as schema from "@torus-ts/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";

/**
 * Create a database connection for apostle-swarm using its dedicated URL.
 * Connection is cached in development to avoid creating new connections on HMR.
 */
const globalForDb = globalThis as unknown as {
  apostleSwarmConn: postgres.Sql | undefined;
};

export function createApostleSwarmDb() {
  const conn =
    globalForDb.apostleSwarmConn ?? postgres(env.APOSTLE_SWARM_POSTGRES_URL);
  if (process.env.NODE_ENV !== "production")
    globalForDb.apostleSwarmConn = conn;
  return drizzle(conn, { schema });
}

export type ApostleSwarmDB = ReturnType<typeof createApostleSwarmDb>;
