import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Percent } from "@polkadot/types/interfaces";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { SS58Address } from "../types/address.js";
import { sb_bigint } from "../types/index.js";
import type { Api } from "./common/index.js";

export async function queryRecyclingPercentage(api: Api): Promise<Percent> {
  const [queryError, recyclingPercentage] = await tryAsync(
    api.query.emission0.emissionRecyclingPercentage(),
  );

  if (queryError !== undefined) {
    console.error("Error querying recycling percentage:", queryError);
    throw queryError;
  }

  return recyclingPercentage;
}

export async function queryIncentivesRatio(api: Api): Promise<Percent> {
  const [queryError, incentivesRatio] = await tryAsync(
    api.query.emission0.incentivesRatio(),
  );
  if (queryError !== undefined) {
    console.error("Error querying incentives ratio:", queryError);
    throw queryError;
  }

  return incentivesRatio;
}

export function queryBlockEmission(api: Api): bigint {
  const [queryError, q] = trySync(() => api.consts.emission0.blockEmission);
  if (queryError !== undefined) {
    console.error("Error querying block emission:", queryError);
    throw queryError;
  }

  const [parseError, emission] = trySync(() => sb_bigint.parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing block emission:", parseError);
    throw parseError;
  }

  return emission;
}

// ==== Weights ====

export async function setChainWeights(
  api: ApiPromise,
  keypair: KeyringPair,
  weights: [SS58Address, number][],
) {
  const [createTxError, tx] = trySync(() =>
    api.tx.emission0.setWeights(weights),
  );
  if (createTxError !== undefined) {
    console.error("Error creating set weights transaction:", createTxError);
    throw createTxError;
  }

  const [signError, signedTx] = await tryAsync(tx.signAndSend(keypair));
  if (signError !== undefined) {
    console.error(
      "Error signing and sending set weights transaction:",
      signError,
    );
    throw signError;
  }

  return signedTx;
}
