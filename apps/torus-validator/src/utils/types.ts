import type { inferProcedureOutput } from "@trpc/server";

import type { AppRouter } from "@torus-ts/api";

export type Module = NonNullable<
  inferProcedureOutput<AppRouter["module"]["byId"]>
>;

export type ReportReason = NonNullable<
  inferProcedureOutput<AppRouter["module"]["byReport"]>
>["reason"];
