import type { Stake } from "@torus-ts/torus-provider/types";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import type { RefObject } from "react";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
  TransactionExtrinsicPromise,
} from "~/context/wallet-provider";
import { createEstimateFee } from "~/utils/helpers";
import type { FeeLabelHandle } from "../../../_components/fee-label";

const STAKE_FEE_BUFFER_PERCENT = 225n;

export interface StakeFeeHandlerParams {
  feeRef: RefObject<FeeLabelHandle | null>;
  maxAmountRef: RefObject<string>;
  addStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  allocatorAddress: string;
  freeBalance: bigint;
  existentialDepositValue: bigint;
  toast: ToastFunction;
}

export const handleEstimateFee = async ({
  feeRef,
  maxAmountRef,
  addStakeTransaction,
  estimateFee,
  allocatorAddress,
  freeBalance,
  existentialDepositValue,
  toast,
}: StakeFeeHandlerParams) => {
  feeRef.current?.setLoading(true);
  const transaction = addStakeTransaction({
    validator: allocatorAddress,
    amount: "1",
  });

  await createEstimateFee(transaction, {
    feeRef,
    maxAmountRef,
    estimateFee,
    toast,
    freeBalance,
    existentialDepositValue,
    transactionType: "Stake",
    bufferPercent: STAKE_FEE_BUFFER_PERCENT,
  });
};
