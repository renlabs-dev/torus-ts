import { asc, eq, isNull, sql, sum } from "drizzle-orm";
import {
  boolean,
  check,
  bigint as drizzleBigint,
  timestamp as drizzleTimestamp,
  index,
  integer,
  numeric,
  pgEnum,
  pgMaterializedView,
  pgTableCreator,
  real,
  serial,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import type { Equals } from "tsafe";
import { assert } from "tsafe";

export const createTable = pgTableCreator((name) => `${name}`);

// ==== Util ====

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

// ==== Permissions ====

/**
 * Stores base permissions that can be assigned
 */
export const permissionSchema = createTable("permission", {
  id: serial("id").primaryKey(),
  permission_id: integer("permission_id").notNull().unique(),

  ...timeFields(),
});

/**
 * Stores permission dependencies forming a Closure Table
 * A permission may depend on other permissions
 */
export const permissionDependenciesSchema = createTable(
  "permission_dependencies",
  {
    id: serial("id").primaryKey(),

    dependent_permission_id: integer("dependent_permission_id")
      .notNull()
      .references(() => permissionSchema.permission_id),

    required_permission_id: integer("required_permission_id")
      .notNull()
      .references(() => permissionSchema.permission_id),

    path_length: integer("path_length").notNull(),

    ...timeFields(),
  },
  (t) => [unique().on(t.dependent_permission_id, t.required_permission_id)],
);
