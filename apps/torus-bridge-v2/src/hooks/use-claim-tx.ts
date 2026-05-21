import { env } from "~/env";
import type { ProofData } from "~/hooks/use-proof";
import { torusMigrationClaimAbi } from "~/lib/contract";
import { BaseError, ContractFunctionRevertedError } from "viem";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

export type ClaimTxError =
  | { kind: "already-claimed"; index: bigint }
  | { kind: "invalid-proof" }
  | { kind: "underfunded"; requested: bigint; balance: bigint }
  | { kind: "generic"; message: string };

export type ClaimTxState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "pending"; txHash: `0x${string}` }
  | { status: "success"; txHash: `0x${string}` }
  | { status: "error"; error: ClaimTxError };

export function useClaimTx(proof: ProofData | undefined): {
  state: ClaimTxState;
  submit: () => void;
  reset: () => void;
} {
  const contractAddress = env(
    "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS",
  ) as `0x${string}`;

  const { address } = useAccount();

  const {
    writeContract,
    data: txHash,
    isPending: isSigning,
    error: writeError,
    reset,
  } = useWriteContract();

  const { isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: txHash !== undefined },
  });

  const submit = () => {
    if (proof === undefined || address === undefined) return;

    writeContract({
      address: contractAddress,
      abi: torusMigrationClaimAbi,
      functionName: "claimTo",
      args: [
        BigInt(proof.index),
        proof.account as `0x${string}`,
        address,
        BigInt(proof.amountRaw),
        proof.proof,
        "0x",
      ],
    });
  };

  if (writeError !== null && writeError !== undefined) {
    return {
      state: { status: "error", error: decodeClaimError(writeError) },
      submit,
      reset,
    };
  }

  if (isSigning) {
    return { state: { status: "signing" }, submit, reset };
  }

  if (txHash !== undefined && isPending) {
    return { state: { status: "pending", txHash }, submit, reset };
  }

  if (txHash !== undefined && isSuccess) {
    return { state: { status: "success", txHash }, submit, reset };
  }

  return { state: { status: "idle" }, submit, reset };
}

function decodeClaimError(error: Error): ClaimTxError {
  if (error instanceof BaseError) {
    const revertError = error.walk(
      (e) => e instanceof ContractFunctionRevertedError,
    );

    if (revertError instanceof ContractFunctionRevertedError) {
      const errorName = revertError.data?.errorName;

      if (errorName === "AlreadyClaimed") {
        const args = revertError.data?.args as [bigint] | undefined;
        return { kind: "already-claimed", index: args?.[0] ?? 0n };
      }

      if (errorName === "InvalidProof") {
        return { kind: "invalid-proof" };
      }

      if (errorName === "InsufficientContractBalance") {
        const args = revertError.data?.args as [bigint, bigint] | undefined;
        return {
          kind: "underfunded",
          requested: args?.[0] ?? 0n,
          balance: args?.[1] ?? 0n,
        };
      }
    }
  }

  return { kind: "generic", message: error.message };
}
