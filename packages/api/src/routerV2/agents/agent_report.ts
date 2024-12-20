import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { eq } from "@torus-ts/db";

import "@torus-ts/db/schema";
import { publicProcedure } from "../../trpc";
import { agentReport } from "@torus-ts/db/schema";

export const agentReportRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.agentReport.findFirst({
        where: eq(agentReport.id, input.id),
      });
    }),
  // POST
} satisfies TRPCRouterRecord;
