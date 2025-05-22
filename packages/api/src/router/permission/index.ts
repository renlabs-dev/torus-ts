import { permissionRouter } from "./permission-details";
import type { TRPCRouterRecord } from "@trpc/server";

export const permissionRouters = {
  details: permissionRouter,
} satisfies TRPCRouterRecord;