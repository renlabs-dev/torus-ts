import { createDb, eq } from "@torus-ts/db";
import { verifierCursorStateSchema } from "@torus-ts/db/schema";

/**
 * Get the current cursor for this verifier from the database.
 * Returns undefined if no cursor exists (fresh start).
 */
export async function getVerifierCursor(
  verifierAgentId: string,
): Promise<string | undefined> {
  const db = createDb();

  const [state] = await db
    .select({ lastCursor: verifierCursorStateSchema.lastCursor })
    .from(verifierCursorStateSchema)
    .where(eq(verifierCursorStateSchema.verifierAgentId, verifierAgentId))
    .limit(1);

  return state?.lastCursor;
}

/**
 * Update the cursor for this verifier in the database.
 * Upserts to handle both new and existing verifiers.
 */
export async function updateVerifierCursor(
  verifierAgentId: string,
  cursor: string,
): Promise<void> {
  const db = createDb();

  await db
    .insert(verifierCursorStateSchema)
    .values({ verifierAgentId, lastCursor: cursor })
    .onConflictDoUpdate({
      target: verifierCursorStateSchema.verifierAgentId,
      set: { lastCursor: cursor },
    });
}
