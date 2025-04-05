import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { ISubmittableResult } from "@polkadot/types/types";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-ts/utils/subspace";
import type { RefObject } from "react";
import type { FeeLabelHandle } from "~/app/_components/fee-label";

interface HandleEstimateFeeProps {
  feeRef: RefObject<FeeLabelHandle | null>;
  transferStakeTransaction: (options: {
    fromValidator: string;
    toValidator: string;
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
  transferStakeTransaction,
  estimateFee,
  allocatorAddress,
  toast,
}: HandleEstimateFeeProps) {
  feeRef.current?.setLoading(true);
  try {
    const transaction = transferStakeTransaction({
      fromValidator: allocatorAddress,
      toValidator: allocatorAddress,
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
      feeRef.current?.updateFee(fromNano(fee));
    } else {
      feeRef.current?.updateFee(null);
    }
  } catch (error) {
    console.error("Error estimating fee:", error);
    feeRef.current?.updateFee(null);
  } finally {
    feeRef.current?.setLoading(false);
  }
}
