import type { Stake } from "@torus-ts/torus-provider/types";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import { fromNano } from "@torus-ts/utils/subspace";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
  TransactionExtrinsicPromise,
} from "~/context/wallet-provider";
import { computeFeeData } from "~/utils/helpers";
import type { FeeLabelHandle } from "../../../components/fee-label";
import { FEE_BUFFER_PERCENT } from "./stake";

export interface StakeFeeHandlerParams {
  feeRef: React.RefObject<FeeLabelHandle | null>;
  maxAmountRef: React.RefObject<string>;
  addStakeTransaction: ({
    validator,
    amount,
  }: Omit<Stake, "callback" | "refetchHandler">) => TransactionExtrinsicPromise;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  allocatorAddress: string;
  freeBalance: bigint;
  existencialDepositValue: bigint;
  toast: ToastFunction;
}

export const handleEstimateFee = async ({
  feeRef,
  maxAmountRef,
  addStakeTransaction,
  estimateFee,
  allocatorAddress,
  freeBalance,
  existencialDepositValue,
  toast,
}: StakeFeeHandlerParams) => {
  feeRef.current?.setLoading(true);

  try {
    const transaction = addStakeTransaction({
      validator: allocatorAddress,
      amount: "1",
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
        freeBalance,
      );
      feeRef.current?.updateFee(feeStr);
      maxAmountRef.current = fromNano(
        maxTransferable - existencialDepositValue,
      );
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
