import { eq } from "@torus-ts/db";
import { predictionReport } from "@torus-ts/db/schema";
import { PREDICTION_REPORT_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const predictionReportRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.predictionReport.findFirst({
        where: eq(predictionReport.id, input.id),
      });
    }),
  // POST
  create: authenticatedProcedure
    .input(PREDICTION_REPORT_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db.insert(predictionReport).values({ ...input, userKey });
    }),
} satisfies TRPCRouterRecord;
