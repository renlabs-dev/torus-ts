import { fromNano } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
} from "~/context/wallet-provider";

/**
 * Returns the fee adjusted by the provided buffer percent.
 */
export function calculateAdjustedFee(
  rawFee: bigint,
  feeBufferPercent: bigint,
): bigint {
  return (rawFee * feeBufferPercent) / 100n;
}

/**
 * Returns the maximum transferable/stakable amount given the free balance and adjusted fee.
 */
export function calculateMaxTransferable(
  freeBalance: bigint,
  adjustedFee: bigint,
): bigint {
  return freeBalance > adjustedFee ? freeBalance - adjustedFee : 0n;
}

/**
 * Computes both the adjusted fee string and the maximum transferable amount string.
 */
export function computeFeeData(
  rawFee: bigint,
  feeBufferPercent: bigint,
  freeBalance: bigint,
): { feeStr: string; maxTransferable: bigint } {
  const adjustedFee = calculateAdjustedFee(rawFee, feeBufferPercent);
  const feeStr = fromNano(adjustedFee);
  const maxTransferable = calculateMaxTransferable(freeBalance, adjustedFee);
  return { feeStr, maxTransferable };
}

function isCurrencyInputValid(torusAmount: string, usdPrice: number): boolean {
  const parsedAmount = parseFloat(torusAmount);

  if (
    isNaN(parsedAmount) ||
    isNaN(usdPrice) ||
    usdPrice <= 0 ||
    parsedAmount < 0
  ) {
    return false;
  }

  return true;
}

export function convertTORUSToUSD(
  torusAmount: string,
  usdPrice: number,
  hasMaskDecimal: boolean = true,
): string {
  const parsedAmount = parseFloat(torusAmount);

  if (!isCurrencyInputValid(torusAmount, usdPrice)) {
    return "";
  }

  const formattedUsdPrice = usdPrice.toFixed(4);

  const result = parsedAmount * parseFloat(formattedUsdPrice);

  return hasMaskDecimal
    ? (Math.floor(result * 10000) / 10000).toString()
    : result.toString();
}

export function convertUSDToTorus(usdAmount: string, usdPrice: number): string {
  const parsedAmount = parseFloat(usdAmount);

  if (!isCurrencyInputValid(usdAmount, usdPrice)) {
    return "";
  }

  return (Math.floor((parsedAmount / usdPrice) * 10000) / 10000).toString();
}

// ===============================
// Fee estimator

type TransactionType =
  | "Send"
  | "Receive"
  | "Stake"
  | "Unstake"
  | "TransferStake";

// Using generic types to handle different transaction types
export interface FeeEstimatorParams {
  // Common parameters
  feeRef: React.MutableRefObject<{
    setLoading: (loading: boolean) => void;
    updateFee: (fee: string | null) => void;
  } | null>;
  estimateFee: (
    transaction: SubmittableExtrinsic<"promise", ISubmittableResult>,
  ) => Promise<bigint | null>;
  toast: ToastFunction;

  // Optional parameters depending on transaction type
  maxAmountRef?: React.MutableRefObject<string>;
  freeBalance?: bigint;
  existentialDepositValue?: bigint;

  // Transaction creation function and parameters with specific types
  transactionType: TransactionType;
  bufferPercent?: bigint;
}

export async function createEstimateFee(
  transaction: SubmittableExtrinsic<"promise", ISubmittableResult> | undefined,
  params: FeeEstimatorParams,
): Promise<void> {
  const {
    feeRef,
    maxAmountRef,
    estimateFee,
    toast,
    freeBalance = 0n,
    existentialDepositValue = 0n,
    transactionType,
    bufferPercent,
  } = params;

  feeRef.current?.setLoading(true);

  // Check if transaction exists
  if (transaction === undefined) {
    toast.error("Error creating transaction for estimating fee.");
    feeRef.current?.setLoading(false);
    return;
  }

  const [error, fee] = await tryAsync(estimateFee(transaction));

  if (error !== undefined) {
    console.error(`Error estimating fee for ${transactionType}:`, error);
    feeRef.current?.updateFee(null);
    if (maxAmountRef) {
      maxAmountRef.current = "";
    }
    feeRef.current?.setLoading(false);
    return;
  }

  if (fee != null) {
    if (
      (transactionType === "Send" || transactionType === "Stake") &&
      bufferPercent !== undefined
    ) {
      const { feeStr, maxTransferable } = computeFeeData(
        fee,
        bufferPercent,
        freeBalance,
      );

      feeRef.current?.updateFee(feeStr);

      if (maxAmountRef) {
        if (transactionType === "Stake") {
          maxAmountRef.current = fromNano(
            maxTransferable - existentialDepositValue,
          );
        } else {
          maxAmountRef.current = fromNano(maxTransferable);
        }
      }
    } else {
      // Simple fee update for Unstake and TransferStake
      feeRef.current?.updateFee(fromNano(fee));
    }
  } else {
    feeRef.current?.updateFee(null);
    if (maxAmountRef) {
      maxAmountRef.current = "";
    }
  }

  feeRef.current?.setLoading(false);
}
