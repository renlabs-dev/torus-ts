import { and, eq } from "@torus-ts/db";
import {
  jobsQueueSchema,
  memoryStoreSchema,
  prospectsSchema,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { assert } from "tsafe";
import { authenticatedProcedure } from "../../trpc";
import {
  getApostle,
  getProspectOrThrow,
  hasProposalStake,
  PROPOSAL_STAKE_THRESHOLD,
  requireApostle,
} from "./helpers";
import {
  PROSPECT_ID_SCHEMA,
  PROSPECT_SUBMIT_SCHEMA,
  QUALITY_TAG_UPDATE_SCHEMA,
} from "./schemas";

export const prospectMutations = {
  submitCommunityProspect: authenticatedProcedure
    .input(PROSPECT_SUBMIT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      const { hasEnough, stake } = await hasProposalStake(
        ctx.wsAPI,
        walletAddress,
      );

      if (!hasEnough) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient stake. Required: ${PROPOSAL_STAKE_THRESHOLD}, Current: ${stake}`,
        });
      }

      const existing = await ctx.db.query.prospectsSchema.findFirst({
        where: eq(prospectsSchema.xHandle, input.xHandle),
      });

      if (existing !== undefined) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Prospect with this X handle already exists",
        });
      }

      const [inserted] = await ctx.db
        .insert(prospectsSchema)
        .values({
          xHandle: input.xHandle,
          origin: "COMMUNITY",
          proposerWalletAddress: walletAddress,
          proposerStakeSnapshot: stake.toString(),
          approvalStatus: "PENDING",
          claimStatus: "UNCLAIMED",
          qualityTag: "UNRATED",
        })
        .returning();

      assert(
        inserted !== undefined,
        "Insert should return the created prospect",
      );
      return inserted;
    }),

  addManualProspect: authenticatedProcedure
    .input(PROSPECT_SUBMIT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await requireApostle(ctx.db, ctx.sessionData.userKey);

      const existing = await ctx.db.query.prospectsSchema.findFirst({
        where: eq(prospectsSchema.xHandle, input.xHandle),
      });
      if (existing !== undefined) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Prospect with this X handle already exists",
        });
      }

      const [inserted] = await ctx.db
        .insert(prospectsSchema)
        .values({
          xHandle: input.xHandle,
          origin: "APOSTLE_MANUAL",
          approvalStatus: "APPROVED",
          claimStatus: "UNCLAIMED",
          qualityTag: "UNRATED",
        })
        .returning();
      assert(
        inserted !== undefined,
        "Insert should return the created prospect",
      );

      await ctx.db
        .insert(memoryStoreSchema)
        .values({ prospectId: inserted.id })
        .onConflictDoNothing();
      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "SCRAPE_PROSPECT",
        payload: { prospectId: inserted.id },
        status: "PENDING",
      });

      return inserted;
    }),

  approveProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await requireApostle(ctx.db, ctx.sessionData.userKey);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.approvalStatus !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not pending approval (current status: ${prospect.approvalStatus})`,
        });
      }

      await ctx.db
        .update(prospectsSchema)
        .set({ approvalStatus: "APPROVED", updatedAt: new Date() })
        .where(eq(prospectsSchema.id, input.prospectId));
      await ctx.db
        .insert(memoryStoreSchema)
        .values({ prospectId: input.prospectId })
        .onConflictDoNothing();
      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "SCRAPE_PROSPECT",
        payload: { prospectId: input.prospectId },
        status: "PENDING",
      });

      return { success: true, prospectId: input.prospectId };
    }),

  rejectProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await requireApostle(ctx.db, ctx.sessionData.userKey);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.approvalStatus !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not pending approval (current status: ${prospect.approvalStatus})`,
        });
      }

      await ctx.db
        .update(prospectsSchema)
        .set({ approvalStatus: "REJECTED", updatedAt: new Date() })
        .where(eq(prospectsSchema.id, input.prospectId));

      return { success: true, prospectId: input.prospectId };
    }),

  claimProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const apostle = await getApostle(ctx.db, ctx.sessionData.userKey);
      if (apostle === null) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles can claim prospects",
        });
      }

      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);
      if (prospect.approvalStatus !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not approved (current status: ${prospect.approvalStatus})`,
        });
      }

      const result = await ctx.db
        .update(prospectsSchema)
        .set({
          claimStatus: "CLAIMED",
          claimedByApostleId: apostle.id,
          claimedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(prospectsSchema.id, input.prospectId),
            eq(prospectsSchema.claimStatus, "UNCLAIMED"),
          ),
        )
        .returning();

      if (result.length === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Prospect was already claimed",
        });
      }

      return { success: true, prospectId: input.prospectId };
    }),

  setQualityTag: authenticatedProcedure
    .input(QUALITY_TAG_UPDATE_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      await requireApostle(ctx.db, ctx.sessionData.userKey);
      const prospect = await getProspectOrThrow(ctx.db, input.prospectId);

      if (prospect.claimStatus !== "UNCLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Quality tag can only be set on unclaimed prospects (current status: ${prospect.claimStatus})`,
        });
      }

      await ctx.db
        .update(prospectsSchema)
        .set({ qualityTag: input.qualityTag, updatedAt: new Date() })
        .where(eq(prospectsSchema.id, input.prospectId));

      return { success: true, prospectId: input.prospectId };
    }),
} satisfies TRPCRouterRecord;
