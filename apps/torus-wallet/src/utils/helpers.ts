import { fromNano } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { ToastFunction } from "@torus-ts/ui/hooks/use-toast";
import type {
  ISubmittableResult,
  SubmittableExtrinsic,
} from "~/context/wallet-provider";
import type { BrandTag } from "@torus-network/torus-utils";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

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

// ===================================
//      Transaction Handlers
/**
 * Creates a handler for form amount changes
 */
// TODO - FINISH AND REPLACE THEU SES IN Send, Stake,Unstake and TransferStake
export function createAmountChangeHandler<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "setValue" | "trigger">,
  toast?: ToastFunction,
) {
  return async (newAmount: string) => {
    // Cast both the path and the value type
    form.setValue(
      "amount" as unknown as Path<T>,
      newAmount as unknown as PathValue<T, Path<T>>,
    );

    const [error] = await tryAsync(
      form.trigger("amount" as unknown as Path<T>),
    );
    if (error !== undefined) {
      console.error("Failed to validate amount:", error);
      toast?.error("Failed to validate amount");
    }
  };
}

/**
 * Creates a transaction callback handler
 */
export function createTransactionCallbackHandler(
  setTransactionStatus: (status: TransactionResult) => void,
  reset: () => void,
) {
  return (result: TransactionResult) => {
    setTransactionStatus(result);
    if (result.status === "SUCCESS") {
      reset();
    }
  };
}

/**
 * Creates a review button click handler
 */
export function createReviewClickHandler<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "trigger">,
  reviewDialogRef: React.RefObject<{ openDialog: () => void }>,
  toast?: ToastFunction,
) {
  return async () => {
    const [triggerError, isValid] = await tryAsync(form.trigger());

    if (triggerError !== undefined) {
      console.error("Form validation failed:", triggerError);
      toast?.error("Form validation failed");
      return;
    }

    if (isValid) {
      reviewDialogRef.current.openDialog();
    }
  };
}

/**
 * Creates a transaction submission handler
 */
export function createSubmitHandler<T, P extends object>(
  transactionFn: (params: P) => Promise<T>,
  setTransactionStatus: (status: TransactionResult) => void,
  operationName: string,
  toast?: ToastFunction,
) {
  return async (params: P) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Awaiting Signature",
    });

    const [error] = await tryAsync(transactionFn(params));

    if (error !== undefined) {
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: error.message || "Transaction failed",
      });
      toast?.error(`Failed to ${operationName}`);
      return false;
    }

    return true;
  };
}

/**
 * Creates a confirmation handler that gets form values and submits
 */
export function createConfirmHandler<T extends FieldValues, P extends object>(
  getValues: () => T,
  submitHandler: (params: P) => Promise<boolean>,
  paramsMapper: (values: T) => P,
) {
  return () => {
    const values = getValues();
    void submitHandler(paramsMapper(values));
  };
}

/**
 * Creates a validator selection handler
 */
export function createValidatorSelectionHandler<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "setValue" | "trigger">,
  fieldName: keyof T & string,
  setCurrentView: (view: string) => void,
  additionalAction?: (address: string) => Promise<void> | void,
  toast?: ToastFunction,
) {
  return async (address: BrandTag<"SS58Address"> & string) => {
    form.setValue(
      fieldName as unknown as Path<T>,
      address as unknown as PathValue<T, Path<T>>,
    );

    setCurrentView("wallet");

    if (additionalAction) {
      const [actionError] = await tryAsync(
        Promise.resolve().then(() => additionalAction(address)),
      );
      if (actionError !== undefined) {
        console.error(`Failed to execute additional action:`, actionError);
      }
    }

    const [triggerError] = await tryAsync(
      form.trigger(fieldName as unknown as Path<T>),
    );

    if (triggerError !== undefined) {
      console.error(`Failed to validate ${fieldName}:`, triggerError);
      toast?.error(`Failed to validate validator`);
    }
  };
}

/**
 * Creates a refetch handler that refetches multiple queries
 */
export function createRefetchHandler(
  refetchFunctions: (() => Promise<unknown>)[],
  toast?: ToastFunction,
) {
  return async () => {
    const [error] = await tryAsync(
      Promise.all(refetchFunctions.map((fn) => fn())),
    );

    if (error !== undefined) {
      console.error("Failed to refetch data:", error);
      toast?.error("Failed to refresh data");
    }
  };
}
