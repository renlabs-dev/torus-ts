import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { TORUS_EVM_RPC_URL, torusEvm } from "~/lib/chain";
import type { WalletClient } from "viem";

export type ChainSetupResult = { ok: true } | { ok: false; error: string };

function chainSetupMessage(error: string): string {
  return `Could not switch your EVM wallet to Torus EVM. Manually configure chain ID ${torusEvm.id} with RPC ${TORUS_EVM_RPC_URL} and symbol TORUS, then try again. ${error}`;
}

export async function ensureWalletOnTorusEvm(
  walletClient: WalletClient,
): Promise<ChainSetupResult> {
  const [switchError] = await tryAsync(
    walletClient.switchChain({ id: torusEvm.id }),
  );

  if (switchError === undefined) {
    return { ok: true };
  }

  return requestWalletTorusEvmConfig(walletClient, switchError.message);
}

export async function requestWalletTorusEvmConfig(
  walletClient: WalletClient,
  previousError?: string,
): Promise<ChainSetupResult> {
  const [addError] = await tryAsync(walletClient.addChain({ chain: torusEvm }));
  const [switchError] = await tryAsync(
    walletClient.switchChain({ id: torusEvm.id }),
  );

  if (switchError === undefined) {
    return { ok: true };
  }

  const details = [previousError, addError?.message, switchError.message]
    .filter((message) => message !== undefined && message.length > 0)
    .join(" ");

  return { ok: false, error: chainSetupMessage(details) };
}
