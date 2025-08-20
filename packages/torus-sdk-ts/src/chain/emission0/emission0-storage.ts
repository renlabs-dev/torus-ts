import type { Percent } from "@polkadot/types/interfaces";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { sb_bigint } from "../../types/index.js";
import type { Api } from "../common/fees.js";

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
