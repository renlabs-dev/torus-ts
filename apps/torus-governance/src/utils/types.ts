import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureOutput } from "@trpc/server";

export type Candidate = NonNullable<
  inferProcedureOutput<AppRouter["cadreCandidate"]["allWithDiscord"]>
>[number];

export type CandidacyStatus = Candidate["candidacyStatus"];
