import { userDiscordInfoSchema } from "@torus-ts/db/schema";
import { USER_DISCORD_INFO_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { authenticatedProcedure } from "../../trpc";

export const discordInfoRouter = {
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
} satisfies TRPCRouterRecord;
