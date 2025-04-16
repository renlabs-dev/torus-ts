import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-network/torus-utils/subspace";
import type { RefObject } from "react";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
  TransactionExtrinsicPromise,
} from "~/context/wallet-provider";
import { computeFeeData } from "~/utils/helpers";
import type { FeeLabelHandle } from "~/app/_components/fee-label";

export const FEE_BUFFER_PERCENT = 102n;

export interface SendFeeHandlerParams {
  feeRef: RefObject<FeeLabelHandle | null>;
  maxAmountRef: RefObject<string>;
  transferTransaction: ({
    to,
    amount,
  }: {
    to: string;
    amount: string;
  }) => TransactionExtrinsicPromise;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  allocatorAddress: string;
  accountFreeBalance: bigint | null;
  toast: ToastFunction;
}

export const handleEstimateFee = async ({
  feeRef,
  maxAmountRef,
  transferTransaction,
  estimateFee,
  allocatorAddress,
  accountFreeBalance,
  toast,
}: SendFeeHandlerParams) => {
  feeRef.current?.setLoading(true);
  try {
    const transaction = transferTransaction({
      to: allocatorAddress,
      amount: "0",
    });

    if (!transaction) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "Error creating transaction for estimating fee.",
      });
      return;
    }

    const fee = await estimateFee(transaction);
    if (fee != null) {
      const { feeStr, maxTransferable } = computeFeeData(
        fee,
        FEE_BUFFER_PERCENT,
        accountFreeBalance ?? 0n,
      );
      feeRef.current?.updateFee(feeStr);
      maxAmountRef.current = fromNano(maxTransferable);
    } else {
      feeRef.current?.updateFee(null);
      maxAmountRef.current = "";
    }
  } catch (error) {
    console.error("Error estimating fee:", error);
    feeRef.current?.updateFee(null);
    maxAmountRef.current = "";
  } finally {
    feeRef.current?.setLoading(false);
  }
};
