import type { TRPCRouterRecord } from "@trpc/server";
import { conversionMutations } from "./conversion-mutations";
import { prospectMutations } from "./prospect-mutations";
import { apostleSwarmQueries } from "./queries";

export const apostleSwarmRouter = {
  ...apostleSwarmQueries,
  ...prospectMutations,
  ...conversionMutations,
} satisfies TRPCRouterRecord;
