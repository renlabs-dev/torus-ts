import type { ApiPromise } from "@polkadot/api";
import type { Header } from "@polkadot/types/interfaces";
import type { IU8a } from "@polkadot/types/types";
import type { Api } from "./modules/_common";
import type { Blocks } from "./types";
import { sb_blocks } from "./types";

export interface LastBlock {
  blockHeader: Header;
  blockNumber: Blocks;
  blockHash: IU8a;
  blockHashHex: `0x${string}`;
  apiAtBlock: Api;
}

export async function queryLastBlock(api: ApiPromise): Promise<LastBlock> {
  const blockHeader = await api.rpc.chain.getHeader();
  const apiAtBlock = await api.at(blockHeader.hash);
  const lastBlock = {
    blockHeader,
    blockNumber: sb_blocks.parse(blockHeader.number),
    blockHash: blockHeader.hash,
    blockHashHex: blockHeader.hash.toHex(),
    apiAtBlock,
  };

  return lastBlock;
}
