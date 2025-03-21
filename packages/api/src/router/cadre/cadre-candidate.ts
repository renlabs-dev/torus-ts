import { authenticatedProcedure, publicProcedure } from "../../trpc";
import { getTableColumns, isNull } from "@torus-ts/db";
// import { isNull } from "@torus-ts/db";
import { cadreCandidateSchema } from "@torus-ts/db/schema";
import { userDiscordInfoSchema } from "@torus-ts/db/schema";
import { CADRE_CANDIDATE_INSERT_SCHEMA } from "@torus-ts/db/validation";
import type { TRPCRouterRecord } from "@trpc/server";
import { and, eq } from "drizzle-orm";

// import { and, eq } from "drizzle-orm";

export const cadreCandidateRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    console.log("oi");
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
  // POST
  create: authenticatedProcedure
    .input(CADRE_CANDIDATE_INSERT_SCHEMA)
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const userKey = ctx.sessionData!.userKey;
      await ctx.db
        .insert(cadreCandidateSchema)
        .values({ ...input, userKey: userKey })
        .execute();
    }),
} satisfies TRPCRouterRecord;
