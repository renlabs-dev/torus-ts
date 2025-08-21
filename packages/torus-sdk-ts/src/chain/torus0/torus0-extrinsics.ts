import type { ApiPromise } from "@polkadot/api";

import type { RegisterAgent } from "./torus0-types.js";

// ==== Agents ====

/**
 * Register an agent on the network
 */
export function registerAgent({ api, name, url, metadata }: RegisterAgent) {
  return api.tx.torus0.registerAgent(name, url, metadata);
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

export function deregisterAgent(api: ApiPromise) {
  return api.tx.torus0.deregisterAgent();
}

// ==== Namespace ====

/**
 * Create a new namespace, automatically creating missing intermediate nodes
 */
export function createNamespace(api: ApiPromise, path: string) {
  return api.tx.torus0.createNamespace(path);
}

/**
 * Delete a namespace and all its children
 */
export function deleteNamespace(api: ApiPromise, path: string) {
  return api.tx.torus0.deleteNamespace(path);
}

// ==== Staking ====

/**
 * Add stake to a validator
 */
export function addStake(api: ApiPromise, validator: string, amount: bigint) {
  return api.tx.torus0.addStake(validator, amount);
}

/**
 * Remove stake from a validator
 */
export function removeStake(
  api: ApiPromise,
  validator: string,
  amount: bigint,
) {
  return api.tx.torus0.removeStake(validator, amount);
}

/**
 * Transfer stake from one validator to another
 */
export function transferStake(
  api: ApiPromise,
  fromValidator: string,
  toValidator: string,
  amount: bigint,
) {
  return api.tx.torus0.transferStake(fromValidator, toValidator, amount);
}
