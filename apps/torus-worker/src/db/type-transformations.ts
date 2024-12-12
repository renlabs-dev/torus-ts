import type { SubspaceModule } from "@torus-ts/subspace";

import type { Module } from "./index.js";

export function SubspaceModuleToDatabase(
  module: SubspaceModule,
  atBlock: number,
  whitelisted: boolean,
): Module {
  return {
    netuid: module.netuid,
    moduleKey: module.key,
    atBlock: atBlock,
    name: module.name ?? null,
    registrationBlock: module.registrationBlock ?? null,
    addressUri: module.address ?? null,
    metadataUri: module.metadata ?? null,
    emission: module.emission ?? null,
    incentive: module.incentive ?? null,
    dividend: module.dividends ?? null,
    delegationFee: module.delegationFee ?? null,
    totalStaked: module.totalStaked,
    totalStakers: module.totalStakers,
    moduleId: module.uid,
    isWhitelisted: whitelisted,
  };
}
