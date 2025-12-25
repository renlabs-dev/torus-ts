import { eq } from "@torus-ts/db";
import {
  conversionLogsSchema,
  jobsQueueSchema,
  prospectsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { authenticatedProcedure } from "../../trpc";
import {
  getApostle,
  getProspectOrThrow,
  isAdmin,
  requireApostle,
} from "./helpers";
import {
  CONVERSION_MARK_SCHEMA,
  FAILURE_MARK_SCHEMA,
  PROSPECT_ID_SCHEMA,
} from "./schemas";

export const conversionMutations = {
  triggerConversionCheck: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await requireApostle(ctx.db, ctx.sessionData.userKey);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.claimStatus !== "CLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Conversion check can only be triggered for claimed prospects (current status: ${prospect.claimStatus})`,
        });
      }

      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "CHECK_CONVERSION",
        payload: { prospectId: input.prospectId },
        status: "PENDING",
        runAt: new Date(),
      });

      return { success: true, prospectId: input.prospectId };
    }),

  markConverted: authenticatedProcedure
    .input(CONVERSION_MARK_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;
      const callerApostle = await getApostle(ctx.db, walletAddress);
      const callerIsAdmin = await isAdmin(ctx.db, walletAddress);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.claimStatus !== "CLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can only mark claimed prospects as converted (current status: ${prospect.claimStatus})`,
        });
      }

      const isClaimingApostle =
        callerApostle !== null &&
        prospect.claimedByApostleId === callerApostle.id;
      if (!isClaimingApostle && !callerIsAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only the claiming apostle or an admin can mark this prospect as converted",
        });
      }

      await ctx.db
        .update(prospectsSchema)
        .set({ claimStatus: "CONVERTED", updatedAt: new Date() })
        .where(eq(prospectsSchema.id, input.prospectId));
      await ctx.db.insert(conversionLogsSchema).values({
        prospectId: input.prospectId,
        apostleId: prospect.claimedByApostleId,
        eventType: "CONVERTED",
        source: "MANUAL_MARK",
        details: input.details ?? null,
      });

      return { success: true, prospectId: input.prospectId };
    }),

  markFailed: authenticatedProcedure
    .input(FAILURE_MARK_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;
      const callerApostle = await getApostle(ctx.db, walletAddress);
      const callerIsAdmin = await isAdmin(ctx.db, walletAddress);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.claimStatus !== "CLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can only mark claimed prospects as failed (current status: ${prospect.claimStatus})`,
        });
      }

      const isClaimingApostle =
        callerApostle !== null &&
        prospect.claimedByApostleId === callerApostle.id;
      if (!isClaimingApostle && !callerIsAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only the claiming apostle or an admin can mark this prospect as failed",
        });
      }

      await ctx.db
        .update(prospectsSchema)
        .set({ claimStatus: "FAILED", updatedAt: new Date() })
        .where(eq(prospectsSchema.id, input.prospectId));
      await ctx.db.insert(conversionLogsSchema).values({
        prospectId: input.prospectId,
        apostleId: prospect.claimedByApostleId,
        eventType: "FAILED",
        source: "MANUAL_MARK",
        details: input.details ?? null,
      });

      return { success: true, prospectId: input.prospectId };
    }),
} satisfies TRPCRouterRecord;
