import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import type { RefObject } from "react";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
  TransactionExtrinsicPromise,
} from "~/context/wallet-provider";
import { createEstimateFee } from "~/utils/helpers";
import type { FeeLabelHandle } from "~/app/_components/fee-label";

const SEND_FEE_BUFFER_PERCENT = 102n;

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

  const transaction = transferTransaction({
    to: allocatorAddress,
    amount: "0",
  });

  await createEstimateFee(transaction, {
    feeRef,
    maxAmountRef,
    estimateFee,
    toast,
    freeBalance: accountFreeBalance ?? 0n,
    transactionType: "Send",
    bufferPercent: SEND_FEE_BUFFER_PERCENT,
  });
};
