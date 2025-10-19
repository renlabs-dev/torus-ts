import { SwarmMemory } from "@torus-network/torus-utils/swarm-memory-client";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure } from "../../trpc";

/**
 * Prophet router - handles operations for adding Twitter accounts to SwarmMemory
 */
export const prophetRouter = {
  /**
   * Add a Twitter username to SwarmMemory for scraping
   *
   * Creates a task to scrape all tweets from the specified user.
   * Requires authentication but uses server wallet for SwarmMemory operations.
   *
   * @returns Task creation result with taskId
   */
  addToMemory: authenticatedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(1, "Username is required")
          .transform((val) => (val.startsWith("@") ? val.slice(1) : val)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // User is authenticated via ctx.sessionData.userKey

      // Validate SwarmMemory configuration is available
      if (!ctx.swarmMnemonic || !ctx.swarmApiUrl) {
        throw new Error(
          "SwarmMemory is not configured. Please provide swarmMnemonic and swarmApiUrl in tRPC context.",
        );
      }

      // Initialize SwarmMemory with server wallet
      // Remove trailing /api/ from baseUrl if present since SwarmMemory adds it
      const baseUrl = ctx.swarmApiUrl.replace(/\/api\/?$/, "");

      const client = await SwarmMemory.fromMnemonic({
        mnemonic: ctx.swarmMnemonic,
        baseUrl,
      });

      // Create scraping task
      const task = await client.tasks.createTask({
        task_type: "ScrapeAllTweetsOfUser",
        value: input.username,
        priority: 5,
      });

      return {
        success: true,
        username: input.username,
        taskId: task.id,
      };
    }),
} satisfies TRPCRouterRecord;
