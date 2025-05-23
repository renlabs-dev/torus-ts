import { and, eq } from "@torus-ts/db";
import {
  commentDigestView,
  commentSchema,
  governanceItemTypeValues,
} from "@torus-ts/db/schema";
import { COMMENT_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const commentRouter = {
  // GET
  byId: publicProcedure
    .input(
      z.object({
        proposalId: z.number(),
        type: z.nativeEnum(governanceItemTypeValues),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(commentDigestView)
        .where(
          and(
            eq(commentDigestView.itemId, input.proposalId),
            eq(commentDigestView.itemType, input.type),
          ),
        )
        .execute();
    }),
  // POST
  create: authenticatedProcedure
    .input(COMMENT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db.insert(commentSchema).values({
        ...input,
        userKey,
      });
      await ctx.db.refreshMaterializedView(commentDigestView);
    }),
} satisfies TRPCRouterRecord;
