import type { TRPCRouterRecord } from "@trpc/server";

import "@torus-ts/db/schema";

import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { governanceItemTypeValues } from "@torus-ts/db/schema";
import { commentDigestView } from "@torus-ts/db/schema";
import { eq, and } from "@torus-ts/db";

export const cadreVoteeRouter = {
  byId: publicProcedure
    .input(
      z.object({
        itemId: z.number(),
        itemType: z.nativeEnum(governanceItemTypeValues),
      }),
    )
    .query(({ ctx, input }) => {
      return ctx.db
        .select()
        .from(commentDigestView)
        .where(
          and(
            eq(commentDigestView.itemId, input.itemId),
            eq(commentDigestView.itemType, input.itemType),
          ),
        )
        .execute();
    }),
} satisfies TRPCRouterRecord;
