import { and, eq, sql } from "@torus-ts/db";
import { askTorusUsageSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { assert } from "tsafe";
import { z } from "zod";
import { authenticatedProcedure } from "../../trpc";

const DAILY_LIMIT = 20;

export const askTorusRouter = {
  /**
   * Get available usage quota for the authenticated user for today (UTC).
   * Returns: { used: number, limit: number, remaining: number, resetAt: string }
   */
  getAvailableUsage: authenticatedProcedure.query(async ({ ctx }) => {
    const userKey = ctx.sessionData.userKey;
    const todayUTC = new Date().toISOString().split("T")[0];
    assert(
      todayUTC !== undefined,
      "ISO date string should always have a date part",
    );

    const usage = await ctx.db.query.askTorusUsageSchema.findFirst({
      where: and(
        eq(askTorusUsageSchema.userKey, userKey),
        eq(askTorusUsageSchema.usageDate, todayUTC),
      ),
    });

    const used = usage?.usageCount ?? 0;
    const remaining = Math.max(0, DAILY_LIMIT - used);

    // Calculate next UTC midnight
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      used,
      limit: DAILY_LIMIT,
      remaining,
      resetAt: tomorrow.toISOString(),
    };
  }),

  /**
   * Register a single usage of Ask Torus feature.
   * Returns updated usage info or throws if limit exceeded.
   */
  registerUsage: authenticatedProcedure.mutation(async ({ ctx }) => {
    const userKey = ctx.sessionData.userKey;
    const todayUTC = new Date().toISOString().split("T")[0];
    assert(
      todayUTC !== undefined,
      "ISO date string should always have a date part",
    );

    // Get current usage
    const current = await ctx.db.query.askTorusUsageSchema.findFirst({
      where: and(
        eq(askTorusUsageSchema.userKey, userKey),
        eq(askTorusUsageSchema.usageDate, todayUTC),
      ),
    });

    const currentCount = current?.usageCount ?? 0;

    // Check if limit exceeded
    if (currentCount >= DAILY_LIMIT) {
      throw new Error(
        `Daily limit of ${DAILY_LIMIT} requests exceeded. Resets at 00:00 UTC.`,
      );
    }

    // Insert or increment
    await ctx.db
      .insert(askTorusUsageSchema)
      .values({
        userKey,
        usageDate: todayUTC,
        usageCount: 1,
      })
      .onConflictDoUpdate({
        target: [askTorusUsageSchema.userKey, askTorusUsageSchema.usageDate],
        set: {
          usageCount: sql`${askTorusUsageSchema.usageCount} + 1`,
        },
      });

    // Return updated usage
    const used = currentCount + 1;
    const remaining = DAILY_LIMIT - used;

    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      used,
      limit: DAILY_LIMIT,
      remaining,
      resetAt: tomorrow.toISOString(),
    };
  }),

  /**
   * Opportunistic cleanup of old usage records.
   * Deletes records older than specified days. Should be called periodically.
   * Only accessible to authenticated users (can be restricted to admin later).
   */
  cleanup: authenticatedProcedure
    .input(z.object({ daysToKeep: z.number().min(1).max(365).default(90) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(askTorusUsageSchema)
        .where(
          sql`${askTorusUsageSchema.usageDate} < CURRENT_DATE - INTERVAL '${sql.raw(input.daysToKeep.toString())} days'`,
        );

      return {
        success: true,
        message: `Cleaned up records older than ${input.daysToKeep} days`,
      };
    }),
} satisfies TRPCRouterRecord;
