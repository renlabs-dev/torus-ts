import { eq } from "@torus-ts/db";
import { filterCursorStateSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure } from "../../trpc";
import { encodeCursor } from "../prophet/prophet";

/**
 * Swarm Filter router - internal endpoints for swarm-filter service
 */
export const swarmFilterRouter = {
  /**
   * Get the current filter cursor position
   */
  getFilterCursor: authenticatedProcedure.query(async ({ ctx }) => {
    const [state] = await ctx.db
      .select({ lastCursor: filterCursorStateSchema.lastCursor })
      .from(filterCursorStateSchema)
      .where(eq(filterCursorStateSchema.id, 1))
      .limit(1);

    return {
      cursor: state?.lastCursor ?? encodeCursor({ createdAt: 0, id: "0" }),
    };
  }),

  /**
   * Update the filter cursor position
   */
  updateFilterCursor: authenticatedProcedure
    .input(z.object({ cursor: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .insert(filterCursorStateSchema)
        .values({ id: 1, lastCursor: input.cursor })
        .onConflictDoUpdate({
          target: filterCursorStateSchema.id,
          set: { lastCursor: input.cursor },
        });
    }),
} satisfies TRPCRouterRecord;
