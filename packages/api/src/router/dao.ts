import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { and, eq, isNull } from "@torus-ts/db";

import "@torus-ts/db/schema";

import {
  cadreCandidatesSchema,
  cadreVoteSchema,
  daoVoteSchema,
} from "@torus-ts/db/schema";
import {
  CADRE_CANDIDATES_INSERT_SCHEMA,
  CADRE_VOTE_INSERT_SCHEMA,
  DAO_VOTE_INSERT_SCHEMA,
} from "@torus-ts/db/validation";

import { authenticatedProcedure, publicProcedure } from "../trpc";

export const daoRouter = {
  // GET
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.daoVoteSchema.findMany({
        where: and(
          eq(daoVoteSchema.daoId, input.id),
          isNull(daoVoteSchema.deletedAt),
        ),
      });
    }),
  byCadre: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreSchema.findMany();
  }),
  byCadreCandidates: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.cadreCandidatesSchema.findMany();
  }),
  // POST
  createVote: authenticatedProcedure
    .input(DAO_VOTE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .update(daoVoteSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(daoVoteSchema.userKey, userKey),
            eq(daoVoteSchema.daoId, input.daoId),
            isNull(daoVoteSchema.deletedAt),
          ),
        )
        .execute();

      await ctx.db
        .insert(daoVoteSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
  deleteVote: authenticatedProcedure
    .input(z.object({ daoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .update(daoVoteSchema)
        .set({
          deletedAt: new Date(),
        })
        .where(
          and(
            eq(daoVoteSchema.userKey, userKey),
            eq(daoVoteSchema.daoId, input.daoId),
          ),
        );
    }),
  addCadreCandidates: authenticatedProcedure
    .input(CADRE_CANDIDATES_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(cadreCandidatesSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
  createCadreVote: authenticatedProcedure
    .input(CADRE_VOTE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(cadreVoteSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
} satisfies TRPCRouterRecord;
