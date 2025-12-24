import { and, desc, eq, isNull } from "@torus-ts/db";
import {
  apostlesSchema,
  conversionLogsSchema,
  jobsQueueSchema,
  memoryStoreSchema,
  prospectsSchema,
  qualityTagValues,
} from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { assert } from "tsafe";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";
import {
  getApostle,
  hasProposalStake,
  isAdmin,
  isApostle,
  PROPOSAL_STAKE_THRESHOLD,
} from "./helpers";

// ==== Input Schemas ====

const PROSPECT_SUBMIT_SCHEMA = z.object({
  xHandle: z
    .string()
    .min(1, "X handle is required")
    .max(256, "X handle cannot exceed 256 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid X handle format"),
});

const PROSPECT_ID_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
});

const QUALITY_TAG_UPDATE_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
  qualityTag: z.enum(
    Object.keys(qualityTagValues) as [
      keyof typeof qualityTagValues,
      ...(keyof typeof qualityTagValues)[],
    ],
    { errorMap: () => ({ message: "Invalid quality tag" }) },
  ),
});

const FAILURE_MARK_SCHEMA = z.object({
  prospectId: z.string().uuid("Invalid prospect ID"),
  details: z.record(z.unknown()).optional(),
});

// ==== Read Queries ====

const listProspectsInputSchema = z.object({
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  claimStatus: z
    .enum(["UNCLAIMED", "CLAIMED", "FAILED", "CONVERTED"])
    .optional(),
  qualityTag: z
    .enum([
      "UNRATED",
      "HIGH_POTENTIAL",
      "MID_POTENTIAL",
      "LOW_POTENTIAL",
      "BAD_PROSPECT",
    ])
    .optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const apostleSwarmRouter = {
  // ==== Read Queries ====

  /**
   * List all apostles with basic info.
   */
  listApostles: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.apostlesSchema.findMany({
      where: isNull(apostlesSchema.deletedAt),
      orderBy: [desc(apostlesSchema.createdAt)],
    });
  }),

  /**
   * List/filter prospects.
   */
  listProspects: publicProcedure
    .input(listProspectsInputSchema)
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

  /**
   * Get detail for a single prospect.
   */
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

      // Get memory store if exists
      const memoryStore = await ctx.db.query.memoryStoreSchema.findFirst({
        where: eq(memoryStoreSchema.prospectId, input.prospectId),
      });

      // Get claiming apostle if claimed
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

  // ==== Command 1: Community prospect submission ====

  /**
   * Community user submits a prospect handle.
   * Requires stake >= PROPOSAL_STAKE_THRESHOLD.
   */
  submitCommunityProspect: authenticatedProcedure
    .input(PROSPECT_SUBMIT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check stake threshold
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

      // Check if prospect already exists
      const existing = await ctx.db.query.prospectsSchema.findFirst({
        where: eq(prospectsSchema.xHandle, input.xHandle),
      });

      if (existing !== undefined) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Prospect with this X handle already exists",
        });
      }

      // Insert prospect
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

  // ==== Command 2: Apostle manual prospect add ====

  /**
   * Apostle creates a prospect directly.
   * Requires caller to be an apostle.
   */
  addManualProspect: authenticatedProcedure
    .input(PROSPECT_SUBMIT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle status
      if (!(await isApostle(ctx.db, walletAddress))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles can add prospects manually",
        });
      }

      // Check if prospect already exists
      const existing = await ctx.db.query.prospectsSchema.findFirst({
        where: eq(prospectsSchema.xHandle, input.xHandle),
      });

      if (existing !== undefined) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Prospect with this X handle already exists",
        });
      }

      // Insert prospect as APPROVED
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

      // Upsert empty memory_store row
      await ctx.db
        .insert(memoryStoreSchema)
        .values({
          prospectId: inserted.id,
        })
        .onConflictDoNothing();

      // Insert SCRAPE_PROSPECT job
      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "SCRAPE_PROSPECT",
        payload: { prospectId: inserted.id },
        status: "PENDING",
      });

      return inserted;
    }),

  // ==== Command 3: Approve PENDING prospect ====

  /**
   * Apostle or admin approves a community-submitted prospect.
   */
  approveProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle or admin status
      if (!(await isApostle(ctx.db, walletAddress))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles or admins can approve prospects",
        });
      }

      // Get prospect
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

      if (prospect.approvalStatus !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not pending approval (current status: ${prospect.approvalStatus})`,
        });
      }

      // Update to APPROVED
      await ctx.db
        .update(prospectsSchema)
        .set({
          approvalStatus: "APPROVED",
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, input.prospectId));

      // Upsert empty memory_store row if not exists
      await ctx.db
        .insert(memoryStoreSchema)
        .values({
          prospectId: input.prospectId,
        })
        .onConflictDoNothing();

      // Insert SCRAPE_PROSPECT job
      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "SCRAPE_PROSPECT",
        payload: { prospectId: input.prospectId },
        status: "PENDING",
      });

      return { success: true, prospectId: input.prospectId };
    }),

  // ==== Command 4: Reject PENDING prospect ====

  /**
   * Apostle or admin rejects a community-submitted prospect.
   */
  rejectProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle or admin status
      if (!(await isApostle(ctx.db, walletAddress))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles or admins can reject prospects",
        });
      }

      // Get prospect
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

      if (prospect.approvalStatus !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not pending approval (current status: ${prospect.approvalStatus})`,
        });
      }

      // Update to REJECTED
      await ctx.db
        .update(prospectsSchema)
        .set({
          approvalStatus: "REJECTED",
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, input.prospectId));

      return { success: true, prospectId: input.prospectId };
    }),

  // ==== Command 5: Claim prospect ====

  /**
   * Apostle claims an approved, unclaimed prospect.
   * Uses atomic update to prevent race conditions.
   */
  claimProspect: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle status
      const apostle = await getApostle(ctx.db, walletAddress);
      if (apostle === null) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles can claim prospects",
        });
      }

      // Get prospect to validate state
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

      if (prospect.approvalStatus !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Prospect is not approved (current status: ${prospect.approvalStatus})`,
        });
      }

      // Atomic update - only succeeds if still UNCLAIMED
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
          message: "Prospect was already claimed by another apostle",
        });
      }

      return { success: true, prospectId: input.prospectId };
    }),

  // ==== Command 6: Set quality tag ====

  /**
   * Apostle or admin sets the quality tag on an unclaimed prospect.
   */
  setQualityTag: authenticatedProcedure
    .input(QUALITY_TAG_UPDATE_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle or admin status
      if (!(await isApostle(ctx.db, walletAddress))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles or admins can set quality tags",
        });
      }

      // Get prospect
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

      if (prospect.claimStatus !== "UNCLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Quality tag can only be set on unclaimed prospects (current status: ${prospect.claimStatus})`,
        });
      }

      // Update quality tag
      await ctx.db
        .update(prospectsSchema)
        .set({
          qualityTag: input.qualityTag,
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, input.prospectId));

      return { success: true, prospectId: input.prospectId };
    }),

  // ==== Command 7: Manual conversion check trigger ====

  /**
   * Apostle or admin requests a conversion check for a claimed prospect.
   */
  triggerConversionCheck: authenticatedProcedure
    .input(PROSPECT_ID_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Check apostle or admin status
      if (!(await isApostle(ctx.db, walletAddress))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only apostles or admins can trigger conversion checks",
        });
      }

      // Get prospect
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

      if (prospect.claimStatus !== "CLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Conversion check can only be triggered for claimed prospects (current status: ${prospect.claimStatus})`,
        });
      }

      // Insert CHECK_CONVERSION job with run_at = now
      await ctx.db.insert(jobsQueueSchema).values({
        jobType: "CHECK_CONVERSION",
        payload: { prospectId: input.prospectId },
        status: "PENDING",
        runAt: new Date(),
      });

      return { success: true, prospectId: input.prospectId };
    }),

  // ==== Command 8: Manual failure mark ====

  /**
   * Claiming apostle or admin marks the prospect as failed.
   */
  markFailed: authenticatedProcedure
    .input(FAILURE_MARK_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const walletAddress = ctx.sessionData.userKey;

      // Get apostle record for caller
      const callerApostle = await getApostle(ctx.db, walletAddress);
      const callerIsAdmin = await isAdmin(ctx.db, walletAddress);

      // Get prospect
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

      if (prospect.claimStatus !== "CLAIMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can only mark claimed prospects as failed (current status: ${prospect.claimStatus})`,
        });
      }

      // Check authorization: must be claiming apostle or admin
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

      // Update claim status to FAILED
      await ctx.db
        .update(prospectsSchema)
        .set({
          claimStatus: "FAILED",
          updatedAt: new Date(),
        })
        .where(eq(prospectsSchema.id, input.prospectId));

      // Insert conversion log
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
