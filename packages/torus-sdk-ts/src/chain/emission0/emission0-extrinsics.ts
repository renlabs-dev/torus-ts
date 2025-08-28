import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "../../types/address.js";

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
