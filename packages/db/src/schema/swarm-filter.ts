import { integer, text } from "drizzle-orm/pg-core";
import { createTable, timeFields } from "./utils";

/**
 * Stores global cursor state for filter processing.
 * Single row table (id always = 1) to track where we are in the tweet dataset.
 */
export const filterCursorStateSchema = createTable("filter_cursor_state", {
  id: integer("id").primaryKey().default(1),
  lastCursor: text("last_cursor").notNull().default("0_0"),
  ...timeFields(),
});
