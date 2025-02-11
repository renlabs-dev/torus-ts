/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { bigintDivision } from "@torus-ts/utils";

/** Related to weights computation */

type UserKey = string;

/**
 * Calculates the final weights for the Torus Allocator, resulting in
 * unbound integers.
 *
 * @param user_stakes        user -> amount staked
 * @param user_weight_maps   user -> module key -> weight (0–100)
 */
export function calcFinalWeights<K>(
  user_stakes: Map<UserKey, bigint>,
  user_weight_maps: Map<UserKey, Map<K, bigint>>,
) {
  const acc_module_weights = new Map<K, bigint>();

  for (const [user_key, user_stake] of user_stakes.entries()) {
    const user_weights = user_weight_maps.get(user_key);
    if (user_weights == null) continue;

    // Total weight the user has distributed to modules
    // total_user_weight = Σ(weight_i)
    const total_user_weight = [...user_weights.values()].reduce(
      (a, b) => a + b,
      0n,
    );
    if (total_user_weight === 0n) continue;

    for (const [module_key, weight] of user_weights.entries()) {
      if (weight === 0n) continue;

      const stake_weight =
        total_user_weight !== 0n
          ? (user_stake * weight) / total_user_weight
          : 0n;

      const cur_module_weight = acc_module_weights.get(module_key) ?? 0n;
      acc_module_weights.set(module_key, cur_module_weight + stake_weight);
    }

    /*
    We have Σ(weight_i) / total_user_weight = 1  
    so      Σ(stake_weight_i) = user_stake

    This effectively distributes the user's stake in nano as "points" to each
    module in proportion to the weights they have assigned to them.
    */
  }

  return acc_module_weights;
}

/**
 * Normalize weights to kinda arbitrary small integers. They need to fit in
 * a u16 which is what Subspace accepts as vote values.
 */
export function normalizeWeightsForVote<K>(
  weights: Map<K, bigint>,
): Map<K, number> {
  const SCALE = 2n << 8n;

  let max_weight = 0n;
  for (const weight of weights.values()) {
    if (weight > max_weight) max_weight = weight;
  }

  const result = new Map<K, number>();
  for (const [module_key, weight] of weights.entries()) {
    const normalized = max_weight !== 0n ? (weight * SCALE) / max_weight : 0n;
    result.set(module_key, Number(normalized));
  }
  return result;
}

/**
 * Normalize weights to float percentages.
 */
export function normalizeWeightsToPercent<K>(
  module_weights: Map<K, bigint>,
): Map<K, number> {
  let total_weight = 0n;
  for (const weight of module_weights.values()) {
    total_weight += weight;
  }

  const result = new Map<K, number>();
  for (const [module_key, weight] of module_weights.entries()) {
    const normalized =
      total_weight !== 0n ? bigintDivision(weight, total_weight) : 0n;
    result.set(module_key, Number(normalized));
  }

  return result;
}

/*
Example:

Then we just normalize.

So if users have:

A: 1000 nano
B:  500 nano
C:  500 nano


and vote:

A:
100% module1

B:
 50% module2
 50% module3

C:
100% module3


We have:

module1: 1000
module2:  250
module3:  750


Final weights:

module1: 100%
module2: 025%
module3: 075%
*/

function _testFinalWeights() {
  const user_stakes = new Map();
  user_stakes.set("A", 1000n);
  user_stakes.set("B", 500n);
  user_stakes.set("C", 500n);

  const user_weight_maps = new Map<string, Map<string, bigint>>();
  user_weight_maps.set("A", new Map());
  user_weight_maps.set("B", new Map());
  user_weight_maps.set("C", new Map());
  user_weight_maps.get("A")?.set("module1", 100n);
  user_weight_maps.get("B")?.set("module2", 50n);
  user_weight_maps.get("B")?.set("module3", 50n);
  user_weight_maps.get("C")?.set("module3", 100n);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const result = calcFinalWeights(user_stakes, user_weight_maps);
  const normalized = normalizeWeightsForVote(result);
  const normalizedPerc = normalizeWeightsToPercent(result);

  console.log(result);
  console.log(normalized);
  console.log(normalizedPerc);
}

// _testFinalWeights();
