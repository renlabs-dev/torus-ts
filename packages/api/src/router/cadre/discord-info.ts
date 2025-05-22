import { userDiscordInfoSchema } from "@torus-ts/db/schema";
import { USER_DISCORD_INFO_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { inArray } from "@torus-ts/db";
import { z } from "zod";

export const discordInfoRouter = {
  // POST
  create: authenticatedProcedure
    .input(USER_DISCORD_INFO_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userDiscordInfoSchema)
        .values({
          discordId: input.discordId,
          userName: input.userName,
          avatarUrl: input.avatarUrl,
        })
        .execute();
      return { success: true };
    }),

  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.userDiscordInfoSchema.findMany();
  }),

  // Get Discord info by discordIds
  byDiscordIds: publicProcedure
    .input(z.object({ discordIds: z.array(z.string()) }))
    .query(({ ctx, input }) => {
      if (input.discordIds.length === 0) {
        return [];
      }
      return ctx.db.query.userDiscordInfoSchema.findMany({
        where: inArray(userDiscordInfoSchema.discordId, input.discordIds),
      });
    }),
} satisfies TRPCRouterRecord;