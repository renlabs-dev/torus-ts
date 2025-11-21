import { eq } from "@torus-ts/db";
import { predictionTopicSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

/**
 * Prediction topic router - handles operations for retrieving prediction topics/tickers
 */
export const topicRouter = {
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const topics = await ctx.db
        .select()
        .from(predictionTopicSchema)
        .where(eq(predictionTopicSchema.id, input.id))
        .limit(1);

      return topics[0] ?? null;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const topics = await ctx.db
      .select({
        id: predictionTopicSchema.id,
        name: predictionTopicSchema.name,
      })
      .from(predictionTopicSchema);

    return topics;
  }),
} satisfies TRPCRouterRecord;
