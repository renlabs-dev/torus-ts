import { encodeCursor } from "@torus-ts/api";
import { createDb } from "@torus-ts/db/client";
import { filterCursorStateSchema } from "@torus-ts/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current filter cursor from the database.
 * Returns the last processed cursor position for tweet pagination.
 */
export async function getFilterCursor(): Promise<{ cursor: string }> {
  const db = createDb();

  const [state] = await db
    .select({ lastCursor: filterCursorStateSchema.lastCursor })
    .from(filterCursorStateSchema)
    .where(eq(filterCursorStateSchema.id, 1))
    .limit(1);

  if (state === undefined) {
    // Return default cursor if no state exists
    return { cursor: encodeCursor({ createdAt: 0, id: "0" }) };
  }

  return { cursor: state.lastCursor };
}

/**
 * Update the filter cursor in the database.
 * Upserts the cursor position to track pagination progress.
 */
export async function updateFilterCursor(cursor: string): Promise<void> {
  const db = createDb();

  await db
    .insert(filterCursorStateSchema)
    .values({ id: 1, lastCursor: cursor })
    .onConflictDoUpdate({
      target: filterCursorStateSchema.id,
      set: { lastCursor: cursor },
    });
}
