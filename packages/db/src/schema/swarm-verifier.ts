import { integer, text } from "drizzle-orm/pg-core";
import { createTable, ss58Address, timeFields } from "./utils";

/**
 * Tracks the last processed cursor for each verifier instance.
 * Prevents reprocessing the same predictions on restart.
 */
export const verifierCursorStateSchema = createTable("verifier_cursor_state", {
  verifierAgentId: ss58Address("verifier_agent_id").primaryKey(),
  lastCursor: text("last_cursor").notNull(),
  ...timeFields(),
});
