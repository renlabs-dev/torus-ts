import { u8aToHex } from "@polkadot/util";
import { decodeAddress } from "@polkadot/util-crypto";
import type { Api } from "@torus-network/sdk"
import { queryLastBlock } from "@torus-network/sdk";
import type { FirstFaucetRequestData, WorkResult } from "~/utils/faucet";
import { MultiWorkerManager, u256FromBytes } from "~/utils/faucet";

export async function performFirstFaucet(
  api: Api,
  address: string,
  token: string,
): Promise<void> {
  const currentBlockData = await queryLastBlock(api);
  const decodedAddress = decodeAddress(address);

  const onFound = async ({ nonce, hash, block }: WorkResult) => {
    console.log('Work found:', { nonce, hash, block });

    const body: FirstFaucetRequestData = {
      recipient: address,
      block,
      nonce: u256FromBytes(nonce),
      hash: u8aToHex(hash),
      token,
    };

    const res = await fetch('/api/faucet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('Faucet API response:', res);
  };

  const workerCount = navigator.hardwareConcurrency || 4;

  const manager = new MultiWorkerManager(workerCount, decodedAddress, currentBlockData, onFound);

  manager.start();

  await api.rpc.chain.subscribeNewHeads(async (_header) => {
    const newBlock = await queryLastBlock(api);
    manager.updateBlock(newBlock);
  });
}

export async function performFaucet(api: Api, address: string): Promise<void> {
  const { hash, nonce } = await work(api, address);

  // TODO: send faucet extrinsic
}
