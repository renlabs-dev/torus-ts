import { and, isNull } from "@torus-ts/db";
import { permissionSchema } from "@torus-ts/db/schema";
import type { TRPCRouterRecord } from "@trpc/server";
import { publicProcedure } from "../../trpc";

export const permissionRouter = {
  // GET
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.permissionSchema.findMany({
      where: and(isNull(permissionSchema.deletedAt)),
    });
  }),
} satisfies TRPCRouterRecord;
