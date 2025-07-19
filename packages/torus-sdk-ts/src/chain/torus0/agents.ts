import type { ApiPromise } from "@polkadot/api";
import type { z } from "zod";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { SS58Address } from "../../types/address.js";
import {
  sb_address,
  sb_bigint,
  sb_number_int,
  sb_percent,
  sb_some,
  sb_string,
  sb_struct,
} from "../../types/index.js";
import type { Api } from "../common/index.js";
import { handleMapEntries } from "../common/index.js";

export const FEES_SCHEMA = sb_struct({
  stakingFee: sb_number_int,
  weightControlFee: sb_number_int,
});

export const AGENT_SCHEMA = sb_struct({
  key: sb_address,
  name: sb_string,
  url: sb_string,
  metadata: sb_string,
  weightPenaltyFactor: sb_percent,
  registrationBlock: sb_bigint,
  fees: FEES_SCHEMA,
});

export type Agent = z.infer<typeof AGENT_SCHEMA>;

export async function queryAgents(api: Api) {
  const [queryError, q] = await tryAsync(api.query.torus0.agents.entries());
  if (queryError !== undefined) {
    console.error("Error querying agents:", queryError);
    throw queryError;
  }

  const [handleError, result] = trySync(() =>
    handleMapEntries(q, sb_address, sb_some(AGENT_SCHEMA)),
  );
  if (handleError !== undefined) {
    console.error("Error handling agents map entries:", handleError);
    throw handleError;
  }

  const [agents, errs] = result;
  for (const err of errs) {
    console.error("ERROR:", err);
    throw new Error("Error in queryAgents");
  }

  return agents;
}

// ==== Transactions ====

export interface RegisterAgent {
  api: ApiPromise;
  agentKey: SS58Address;
  name: string;
  url: string;
  metadata: string;
}

/**
 * Register an agent on the network
 */
export function registerAgent({
  api,
  agentKey,
  name,
  url,
  metadata,
}: RegisterAgent) {
  return api.tx.torus0.registerAgent(agentKey, name, url, metadata);
}

/**
 * Updates origin's key agent metadata.
 */
export function updateAgent(
  api: ApiPromise,
  url: string,
  metadata?: string | null,
  stakingFee?: number | null,
  weightControlFee?: number | null,
) {
  return api.tx.torus0.updateAgent(
    url,
    metadata ?? null,
    stakingFee ?? null,
    weightControlFee ?? null,
  );
}
