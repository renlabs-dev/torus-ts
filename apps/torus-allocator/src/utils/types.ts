import type { inferProcedureOutput } from "@trpc/server";

import type { AppRouter } from "@torus-ts/api";

export type Agent = NonNullable<
  inferProcedureOutput<AppRouter["agent"]["byId"]>
>;

export type ReportReason = NonNullable<
  inferProcedureOutput<AppRouter["agentReport"]["byId"]>
>["reason"];
