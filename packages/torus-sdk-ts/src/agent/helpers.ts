import { setup } from "@torus-network/sdk";

const NODE_URL = "wss://api.testnet.torus.network";

export const connectToChainRpc = async () => setup(NODE_URL);

export type ApiPromise = Awaited<ReturnType<typeof connectToChainRpc>>;

export interface Helpers {
  checkTransaction: ({
    blockHash,
    transactionHash,
  }: {
    blockHash: string;
    transactionHash: string;
  }) => Promise<{
    isValid: boolean;
  }>;
}

export const checkTransaction = (api: ApiPromise) => {
  const f: Helpers["checkTransaction"] = async ({
    blockHash,
    transactionHash,
  }) => {
    const signedBlock = await api.rpc.chain.getBlock(blockHash);

    const apiAt = await api.at(signedBlock.block.header.hash);
    const allRecords = await apiAt.query.system.events();

    let isValid = false;

    signedBlock.block.extrinsics.forEach((extrinsic, index) => {
      const extrinsicHash = extrinsic.hash.toHex();

      allRecords
        .filter(
          ({ phase }) =>
            phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index),
        )
        .forEach(({ event }) => {
          if (extrinsicHash === transactionHash) {
            const success = api.events.system.ExtrinsicSuccess.is(event);
            const failed = api.events.system.ExtrinsicFailed.is(event);

            if (success) {
              isValid = true;
            }

            if (failed) {
              isValid = false;
            }
          }
        });
    });

    return {
      isValid,
    };
  };

  return f;
};

