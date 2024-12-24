import type { SubspaceAgent } from "@torus-ts/subspace";

import type { Agent } from "./index.js";

export function SubspaceAgentToDatabase(
  agent: SubspaceAgent,
  atBlock: number,
  whitelisted: boolean,
): Agent {
  return {
    key: agent.key,
    name: agent.name ?? null,
    atBlock: atBlock,
    registrationBlock: agent.registrationBlock ?? null,
    apiUrl: agent.apiUrl ?? null,
    metadataUri: agent.metadataUri ?? null,
    weightFactor: agent.weightFactor ?? null,
    isWhitelisted: whitelisted,
    totalStaked: agent.totalStaked,
    totalStakers: agent.totalStakers,
  };
}
