import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";

export type Agent = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["byId"]>
>;

export type ReportReason = NonNullable<
  inferProcedureOutput<AppRouter["agentReport"]["byId"]>
>["reason"];
