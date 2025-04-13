import { getTableColumns, isNull } from "@torus-ts/db";
import {
  cadreCandidateSchema,
  candidacyStatusValues,
  userDiscordInfoSchema,
} from "@torus-ts/db/schema";
import { CADRE_CANDIDATE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { authenticatedProcedure, publicProcedure } from "../../trpc";

export const cadreCandidateRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreCandidateSchema.findMany({
      where: isNull(cadreCandidateSchema.deletedAt),
    });
  }),
  allWithDiscord: publicProcedure.query(async ({ ctx }) => {
    const discordSchema = userDiscordInfoSchema;
    const candidateSchema = cadreCandidateSchema;

    const candidates = await ctx.db
      .select({
        // Discord info
        userName: discordSchema.userName,
        avatarUrl: discordSchema.avatarUrl,
        ...getTableColumns(candidateSchema),
      })
      .from(candidateSchema)
      .leftJoin(
        discordSchema,
        eq(candidateSchema.discordId, discordSchema.discordId),
      )
      .where(
        and(isNull(candidateSchema.deletedAt), isNull(discordSchema.deletedAt)),
      );
    return candidates;
  }),
  // New filtered endpoint that accepts a status parameter
  filteredByStatusWithDiscord: publicProcedure
    .input(
      z.object({
        status: z
          .enum(["PENDING", "ACCEPTED", "REJECTED", "REMOVED"])
          .default("PENDING"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const discordSchema = userDiscordInfoSchema;
      const candidateSchema = cadreCandidateSchema;
      const status = candidacyStatusValues[input.status];

      const candidates = await ctx.db
        .select({
          // Discord info
          userName: discordSchema.userName,
          avatarUrl: discordSchema.avatarUrl,
          ...getTableColumns(candidateSchema),
        })
        .from(candidateSchema)
        .leftJoin(
          discordSchema,
          eq(candidateSchema.discordId, discordSchema.discordId),
        )
        .where(
          and(
            isNull(candidateSchema.deletedAt),
            isNull(discordSchema.deletedAt),
            eq(candidateSchema.candidacyStatus, status),
          ),
        );
      return candidates;
    }),
  // POST
  create: authenticatedProcedure
    .input(CADRE_CANDIDATE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      const userKey = ctx.sessionData.userKey;
      await ctx.db
        .insert(cadreCandidateSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
} satisfies TRPCRouterRecord;
