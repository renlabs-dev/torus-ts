import { eq } from "@torus-ts/db";
import { predictionTopicSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

/**
 * Prediction topic router - handles operations for retrieving prediction topics/tickers
 */
export const topicRouter = {
  /**
   * Get all tickers (topics with parent name = 'cryptomarket')
   *
   * @returns Array of ticker topics
   */
  getTickers: publicProcedure.query(async ({ ctx }) => {
    // First find the cryptomarket parent topic
    const cryptomarketTopics = await ctx.db
      .select()
      .from(predictionTopicSchema)
      .where(eq(predictionTopicSchema.name, "cryptomarket"))
      .limit(1);

    const cryptomarket = cryptomarketTopics[0];
    if (!cryptomarket) {
      return [];
    }

    // Then get all child topics (tickers)
    const tickers = await ctx.db
      .select({
        id: predictionTopicSchema.id,
        name: predictionTopicSchema.name,
        contextSchema: predictionTopicSchema.contextSchema,
      })
      .from(predictionTopicSchema)
      .where(eq(predictionTopicSchema.parentId, cryptomarket.id));

    return tickers;
  }),
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
