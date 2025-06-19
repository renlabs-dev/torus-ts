import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { errorToString, toWei } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { getTokenByIndex } from "~/hooks/token";
import { logger } from "~/utils/logger";
import type { TransferFormValues } from "~/utils/types";

const INSUFFICIENT_FUNDS_REGEX = /insufficient.[funds|lamports]/i;
const EMPTY_ACCOUNT_REGEX = /AccountNotFound/i;
const GAS_ESTIMATION_REGEX = /gas.*(estimation|required)/i;
const BASE_ETH_INSUFFICIENT_REGEX = /insufficient.*eth/i;

interface ValidationError {
  form?: string;
  amount?: string;
  details?: string;
  errorType?:
    | "insufficient_funds"
    | "gas_estimation"
    | "base_eth_insufficient"
    | "token_error"
    | "account_error"
    | "validation_error";
}

function createValidationError(
  type: ValidationError["errorType"],
  details: string,
  field?: "form" | "amount",
): ValidationError {
  const error: ValidationError = { details, errorType: type };
  if (field) {
    error[field] = "Error";
  }
  return error;
}

export function validateFormSync({
  origin,
  destination,
  tokenIndex,
  amount,
  recipient,
}: TransferFormValues): Record<string, string> | void {
  const errors: Record<string, string> = {};

  // Validate recipient is not empty
  if (!recipient || recipient.trim() === "") {
    errors.recipient = "Recipient address is required";
  }

  // Validate amount is not empty
  if (!amount || amount.trim() === "") {
    errors.amount = "Amount is required";
  } else {
    // Validate amount is a valid number
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber)) {
      errors.amount = "Amount must be a valid number";
    } else if (amountNumber <= 0) {
      errors.amount = "Amount must be greater than 0";
    }
  }

  // Validate tokenIndex is defined
  if (tokenIndex === undefined) {
    errors.tokenIndex = "Token selection is required";
  }

  // Validate origin chain is selected
  if (!origin || origin.trim() === "") {
    errors.origin = "Origin chain is required";
  }

  // Validate destination chain is selected
  if (!destination || destination.trim() === "") {
    errors.destination = "Destination chain is required";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

export async function validateForm(
  warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
): Promise<ValidationError | Record<string, unknown>> {
  // Validate recipient is not empty
  if (!recipient || recipient.trim() === "") {
    return createValidationError(
      "validation_error",
      "Recipient address is required. Please enter a valid recipient address and try again.",
      "form",
    );
  }

  // Validate amount is not empty
  if (!amount || amount.trim() === "") {
    return createValidationError(
      "validation_error",
      "Amount is required. Please enter a valid amount and try again.",
      "amount",
    );
  }

  // Validate amount is a valid number
  const amountNumber = parseFloat(amount);
  if (isNaN(amountNumber)) {
    return createValidationError(
      "validation_error",
      "Amount must be a valid number. Please enter a valid amount and try again.",
      "amount",
    );
  }

  // Validate amount is positive
  if (amountNumber <= 0) {
    return createValidationError(
      "validation_error",
      "Amount must be greater than 0. Please enter a positive amount and try again.",
      "amount",
    );
  }

  // Validate tokenIndex is defined
  if (tokenIndex === undefined) {
    return createValidationError(
      "validation_error",
      "Token selection is required. Please select a valid token and try again.",
      "form",
    );
  }

  // Validate origin chain is selected
  if (!origin || origin.trim() === "") {
    return createValidationError(
      "validation_error",
      "Origin chain is required. Please select a valid origin chain and try again.",
      "form",
    );
  }

  // Validate destination chain is selected
  if (!destination || destination.trim() === "") {
    return createValidationError(
      "validation_error",
      "Destination chain is required. Please select a valid destination chain and try again.",
      "form",
    );
  }

  // For basic validations, return empty object to indicate success
  // Complex validations (balance check, etc.) will be done in onSubmit
  return {};
}

export async function validateFormWithBalance(
  warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
): Promise<ValidationError | Record<string, unknown>> {
  // First do basic validation
  const basicValidation = validateFormSync({
    origin,
    destination,
    tokenIndex,
    amount,
    recipient,
  });
  if (basicValidation) {
    // Convert sync errors to async format
    const firstError = Object.values(basicValidation)[0];
    return createValidationError(
      "validation_error",
      firstError as string,
      "form",
    );
  }

  const [tokenError, token] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );
  if (tokenError || !token) {
    logger.error("Error getting token:", tokenError);
    const details = tokenError
      ? `Token retrieval failed: ${errorToString(tokenError, 200)}`
      : "Token configuration not found";
    return createValidationError("token_error", details, "form");
  }

  const [amountError, amountWei] = trySync(() => toWei(amount, token.decimals));
  if (amountError) {
    logger.error("Error converting amount to wei:", amountError);
    const details = `Amount conversion failed: ${errorToString(amountError, 200)}. Please check your input format.`;
    return createValidationError("validation_error", details, "amount");
  }

  const [accountError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(warpCore.multiProvider, origin, accounts),
  );
  if (accountError || !address) {
    logger.error("Error getting account address:", accountError);
    const details = accountError
      ? `Account retrieval failed: ${errorToString(accountError, 200)}`
      : "No account address found. Please ensure your wallet is properly connected.";
    return createValidationError("account_error", details, "form");
  }

  // Check if amount exceeds available balance
  const [balanceError, currentBalance] = await tryAsync(
    token.getBalance(warpCore.multiProvider, address),
  );
  if (balanceError) {
    logger.error("Error getting token balance:", balanceError);
    return createValidationError(
      "token_error",
      `Failed to fetch balance: ${errorToString(balanceError, 200)}. Please try again.`,
      "form",
    );
  }

  // Get the maximum transferable amount (considering gas fees)
  const [maxAmountError, maxTransferAmount] = await tryAsync(
    warpCore.getMaxTransferAmount({
      balance: currentBalance,
      destination,
      sender: address,
      senderPubKey: await publicKey,
    }),
  );

  if (maxAmountError) {
    logger.error("Error getting max transfer amount:", maxAmountError);
    return createValidationError(
      "token_error",
      `Failed to calculate maximum transfer amount: ${errorToString(maxAmountError, 200)}. Please try again.`,
      "form",
    );
  }

  logger.debug("Balance check:", {
    amountWei: amountWei,
    currentBalance: currentBalance.amount.toString(),
    maxTransferAmount: maxTransferAmount.amount.toString(),
    amountWeiBigInt: BigInt(amountWei),
    comparison: BigInt(amountWei) > maxTransferAmount.amount,
  });

  if (BigInt(amountWei) > maxTransferAmount.amount) {
    const formattedAmount = token.amount(amountWei).getDecimalFormattedAmount();
    const formattedMaxAmount = maxTransferAmount.getDecimalFormattedAmount();

    logger.debug("Insufficient balance detected:", {
      amountWei: amountWei,
      currentBalance: currentBalance.amount.toString(),
      maxTransferAmount: maxTransferAmount.amount.toString(),
      formattedAmount,
      formattedMaxAmount,
      tokenSymbol: token.symbol,
    });

    return createValidationError(
      "insufficient_funds",
      `Amount exceeds maximum transferable: ${formattedAmount} ${token.symbol}. Maximum is ${formattedMaxAmount} ${token.symbol} (including gas fees). Use "Max" button or enter a smaller amount.`,
      "amount",
    );
  }

  const senderPubKey = await publicKey;

  const [validateError, result] = await tryAsync(
    warpCore.validateTransfer({
      originTokenAmount: token.amount(amountWei),
      destination,
      recipient,
      sender: address,
      senderPubKey,
    }),
  );

  if (validateError) {
    logger.error("Error validating transfer:", validateError);
    const errorMsg = errorToString(validateError, 40);

    const fullErrorMessage = `${errorMsg} ${validateError.message || ""}`;
    const detailedError = errorToString(validateError, 500);

    if (
      INSUFFICIENT_FUNDS_REGEX.test(fullErrorMessage) ||
      EMPTY_ACCOUNT_REGEX.test(fullErrorMessage)
    ) {
      const [balanceError, currentBalance] = await tryAsync(
        token.getBalance(warpCore.multiProvider, address),
      );
      if (balanceError) {
        logger.error("Error getting token balance:", balanceError);
        return createValidationError(
          "token_error",
          `Failed to fetch balance: ${errorToString(balanceError, 200)}. Please try again.`,
          "form",
        );
      }
      const formattedBalance = currentBalance.getDecimalFormattedAmount();
      const formattedAmount = token
        .amount(amountWei)
        .getDecimalFormattedAmount();

      return createValidationError(
        "insufficient_funds",
        `Insufficient balance: You have ${formattedBalance} ${token.symbol} and are trying to transfer ${formattedAmount} ${token.symbol}. Please adjust the amount and try again.`,
        "form",
      );
    }

    if (GAS_ESTIMATION_REGEX.test(fullErrorMessage)) {
      return createValidationError(
        "gas_estimation",
        `Gas estimation failed: ${detailedError}. Please ensure you have enough ETH to cover the gas fees on the origin chain.`,
        "form",
      );
    }

    if (BASE_ETH_INSUFFICIENT_REGEX.test(fullErrorMessage)) {
      return createValidationError(
        "base_eth_insufficient",
        `Insufficient ETH on Base: ${detailedError}. You need ETH on Base to pay for transaction gas fees when bridging from Base. Please add some ETH to your Base wallet.`,
        "form",
      );
    }

    return createValidationError(
      "validation_error",
      `Transfer validation failed: ${detailedError}. Please check your inputs and try again.`,
      "form",
    );
  }

  return result ?? {};
}
