import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import type { RefObject } from "react";
import type { FeeLabelHandle } from "~/app/_components/fee-label";
import { createEstimateFee } from "~/utils/helpers";

interface HandleEstimateFeeProps {
  feeRef: RefObject<FeeLabelHandle | null>;
  removeStakeTransaction: (options: {
    validator: string;
    amount: string;
  }) => SubmittableExtrinsic<"promise", ISubmittableResult> | undefined;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  allocatorAddress: string;
  toast: ToastFunction;
}

export async function handleEstimateFee({
  feeRef,
  removeStakeTransaction,
  estimateFee,
  allocatorAddress,
  toast,
}: HandleEstimateFeeProps) {
  feeRef.current?.setLoading(true);

  const transaction = removeStakeTransaction({
    validator: allocatorAddress,
    amount: "0",
  });

  await createEstimateFee(transaction, {
    feeRef,
    estimateFee,
    toast,
    transactionType: "Unstake",
  });
}
