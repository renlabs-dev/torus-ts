import type { inferProcedureOutput } from "@trpc/server";

import type { AppRouter } from "@commune-ts/api";

export type Subnet = NonNullable<
  inferProcedureOutput<AppRouter["subnet"]["byId"]>
>;

export type Module = NonNullable<
  inferProcedureOutput<AppRouter["module"]["byId"]>
>;

export type ReportReason = NonNullable<
  inferProcedureOutput<AppRouter["module"]["byReport"]>
>["reason"];
