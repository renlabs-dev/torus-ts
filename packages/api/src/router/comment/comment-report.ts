import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq } from "@torus-ts/db";

import "@torus-ts/db/schema";
import { commentReportSchema } from "@torus-ts/db/schema";
import { COMMENT_REPORT_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const commentReportRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.commentReportSchema.findFirst({
        where: eq(commentReportSchema.id, input.id),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(COMMENT_REPORT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db.insert(commentReportSchema).values({ ...input, userKey });
    }),
} satisfies TRPCRouterRecord;
