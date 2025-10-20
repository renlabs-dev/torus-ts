import { sql } from "drizzle-orm";
import {
  bigint as drizzleBigint,
  timestamp as drizzleTimestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bigint = (name: string) => drizzleBigint(name, { mode: "bigint" });

export const timestampz = (name: string) =>
  drizzleTimestamp(name, { withTimezone: true, mode: "date" });

export const timestampzNow = (name: string) =>
  timestampz(name).defaultNow().notNull();

export const ss58Address = (name: string) => varchar(name, { length: 256 });

export const timeFields = () => ({
  createdAt: timestampzNow("created_at"),
  updatedAt: timestampzNow("updated_at").$onUpdate(() => new Date()),
  deletedAt: timestampz("deleted_at").default(sql`null`),
});
