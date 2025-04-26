import type { ApiPromise } from "@polkadot/api";
import type { Header } from "@polkadot/types/interfaces";
import type { IU8a } from "@polkadot/types/types";
import type { Api } from "./modules/_common";
import type { Blocks } from "./types";
import { sb_blocks } from "./types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

export interface LastBlock {
  blockHeader: Header;
  blockNumber: Blocks;
  blockHash: IU8a;
  blockHashHex: `0x${string}`;
  apiAtBlock: Api;
}

export async function queryLastBlock(api: ApiPromise): Promise<LastBlock> {
  const [headerError, blockHeader] = await tryAsync(api.rpc.chain.getHeader());
  if (headerError !== undefined) {
    console.error("Error getting block header:", headerError);
    throw headerError;
  }

  const [apiError, apiAtBlock] = await tryAsync(api.at(blockHeader.hash));
  if (apiError !== undefined) {
    console.error("Error getting API at block:", apiError);
    throw apiError;
  }

  const [parseError, blockNumber] = trySync(() =>
    sb_blocks.parse(blockHeader.number),
  );
  if (parseError !== undefined) {
    console.error("Error parsing block number:", parseError);
    throw parseError;
  }

  const [hashError, blockHashHex] = trySync(() => blockHeader.hash.toHex());
  if (hashError !== undefined) {
    console.error("Error converting block hash to hex:", hashError);
    throw hashError;
  }

  const lastBlock = {
    blockHeader,
    blockNumber,
    blockHash: blockHeader.hash,
    blockHashHex,
    apiAtBlock,
  };

  return lastBlock;
}
