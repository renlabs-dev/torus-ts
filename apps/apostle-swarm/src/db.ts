import * as schema from "@torus-ts/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

export const createDb = () => {
  const conn = globalForDb.conn ?? postgres(env.APOSTLE_SWARM_POSTGRES_URL);
  globalForDb.conn = conn;
  return drizzle(conn, { schema });
};

export type DB = ReturnType<typeof createDb>;
