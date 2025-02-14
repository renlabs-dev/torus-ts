import "@torus-ts/db/schema";

import { and, eq, isNull } from "@torus-ts/db";
import { agentReportSchema } from "@torus-ts/db/schema";
import { AGENT_REPORT_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const agentReportRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentReportSchema.findFirst({
        where: and(
          eq(agentReportSchema.id, input.id),
          isNull(agentReportSchema.deletedAt),
        ),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(AGENT_REPORT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db.insert(agentReportSchema).values({ ...input, userKey });
    }),
} satisfies TRPCRouterRecord;
