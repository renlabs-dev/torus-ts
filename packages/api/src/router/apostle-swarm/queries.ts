import { and, desc, eq, isNull } from "@torus-ts/db";
import {
  apostlesSchema,
  memoryStoreSchema,
  prospectsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../../trpc";
import { LIST_PROSPECTS_SCHEMA, PROSPECT_ID_SCHEMA } from "./schemas";

export const apostleSwarmQueries = {
  listApostles: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.apostlesSchema.findMany({
      where: isNull(apostlesSchema.deletedAt),
      orderBy: [desc(apostlesSchema.createdAt)],
    });
  }),

  listProspects: publicProcedure
    .input(LIST_PROSPECTS_SCHEMA)
    .query(async ({ ctx, input }) => {
      const { approvalStatus, claimStatus, qualityTag, limit, offset } = input;

      const conditions = [isNull(prospectsSchema.deletedAt)];

      if (approvalStatus !== undefined) {
        conditions.push(eq(prospectsSchema.approvalStatus, approvalStatus));
      }
      if (claimStatus !== undefined) {
        conditions.push(eq(prospectsSchema.claimStatus, claimStatus));
      }
      if (qualityTag !== undefined) {
        conditions.push(eq(prospectsSchema.qualityTag, qualityTag));
      }

      return ctx.db.query.prospectsSchema.findMany({
        where: and(...conditions),
        orderBy: [desc(prospectsSchema.createdAt)],
        limit,
        offset,
      });
    }),

  getProspect: publicProcedure
    .input(PROSPECT_ID_SCHEMA)
    .query(async ({ ctx, input }) => {
      const prospect = await ctx.db.query.prospectsSchema.findFirst({
        where: and(
          eq(prospectsSchema.id, input.prospectId),
          isNull(prospectsSchema.deletedAt),
        ),
      });

      if (prospect === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prospect not found",
        });
      }

      const memoryStore = await ctx.db.query.memoryStoreSchema.findFirst({
        where: eq(memoryStoreSchema.prospectId, input.prospectId),
      });

      let claimingApostle = null;
      if (prospect.claimedByApostleId !== null) {
        claimingApostle = await ctx.db.query.apostlesSchema.findFirst({
          where: eq(apostlesSchema.id, prospect.claimedByApostleId),
        });
      }

      return {
        ...prospect,
        memoryStore: memoryStore ?? null,
        claimingApostle,
      };
    }),
} satisfies TRPCRouterRecord;
