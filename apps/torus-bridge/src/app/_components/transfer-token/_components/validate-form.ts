import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { errorToString, toWei } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { getTokenByIndex } from "~/hooks/token";
import { logger } from "~/utils/logger";
import type { TransferFormValues } from "~/utils/types";
import { ValidationErrorType, ValidationField } from "~/types/validation";
import type { ValidationResult } from "~/types/validation";
import {
  VALIDATION_REGEX,
  createValidationError,
  validateRequiredField,
  validatePositiveNumber,
} from "~/utils/validation-helpers";

export function validateFormSync({
  origin,
  destination,
  tokenIndex,
  amount,
  recipient,
}: TransferFormValues): Record<string, string> | void {
  const errors: Record<string, string> = {};

  const recipientError = validateRequiredField(recipient, "Recipient address");
  if (recipientError) errors.recipient = recipientError;

  const amountError = validateRequiredField(amount, "Amount");
  if (amountError) {
    errors.amount = amountError;
  } else if (amount) {
    const positiveNumberError = validatePositiveNumber(amount, "Amount");
    if (positiveNumberError) errors.amount = positiveNumberError;
  }

  if (tokenIndex === undefined) {
    errors.tokenIndex = "Token selection is required";
  }

  const originError = validateRequiredField(origin, "Origin chain");
  if (originError) errors.origin = originError;

  const destinationError = validateRequiredField(
    destination,
    "Destination chain",
  );
  if (destinationError) errors.destination = destinationError;

  return Object.keys(errors).length > 0 ? errors : undefined;
}

export function validateForm(
  _warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  _accounts: Record<ProtocolType, AccountInfo>,
): ValidationResult {
  const recipientError = validateRequiredField(recipient, "Recipient address");
  if (recipientError) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `${recipientError}. Please enter a valid recipient address and try again.`,
      ValidationField.FORM,
    );
  }

  const amountError = validateRequiredField(amount, "Amount");
  if (amountError) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `${amountError}. Please enter a valid amount and try again.`,
      ValidationField.AMOUNT,
    );
  }

  if (amount) {
    const positiveNumberError = validatePositiveNumber(amount, "Amount");
    if (positiveNumberError) {
      return createValidationError(
        ValidationErrorType.VALIDATION_ERROR,
        `${positiveNumberError}. Please enter a valid amount and try again.`,
        ValidationField.AMOUNT,
      );
    }
  }

  if (tokenIndex === undefined) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      "Token selection is required. Please select a valid token and try again.",
      ValidationField.FORM,
    );
  }

  const originError = validateRequiredField(origin, "Origin chain");
  if (originError) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `${originError}. Please select a valid origin chain and try again.`,
      ValidationField.FORM,
    );
  }

  const destinationError = validateRequiredField(
    destination,
    "Destination chain",
  );
  if (destinationError) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `${destinationError}. Please select a valid destination chain and try again.`,
      ValidationField.FORM,
    );
  }

  return {};
}

export async function validateFormWithBalance(
  warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
): Promise<ValidationResult> {
  const basicValidation = validateFormSync({
    origin,
    destination,
    tokenIndex,
    amount,
    recipient,
  });

  if (basicValidation) {
    const firstError = Object.values(basicValidation)[0];
    if (!firstError) {
      return createValidationError(
        ValidationErrorType.VALIDATION_ERROR,
        "Unknown validation error",
        ValidationField.FORM,
      );
    }
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      firstError,
      ValidationField.FORM,
    );
  }

  const token = getTokenByIndex(warpCore, tokenIndex);
  if (!token) {
    logger.error("Token configuration not found", new Error("Token not found"));
    return createValidationError(
      ValidationErrorType.TOKEN_ERROR,
      "Token configuration not found",
      ValidationField.FORM,
    );
  }

  if (!amount) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      "Amount is required",
      ValidationField.AMOUNT,
    );
  }

  const [amountError, amountWei] = trySync(() => toWei(amount, token.decimals));
  if (amountError) {
    logger.error("Error converting amount to wei:", amountError);
    const details = `Amount conversion failed: ${errorToString(amountError, 200)}. Please check your input format.`;
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      details,
      ValidationField.AMOUNT,
    );
  }

  if (!origin) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      "Origin chain is required",
      ValidationField.FORM,
    );
  }

  const [accountError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(warpCore.multiProvider, origin, accounts),
  );

  if (accountError || !address) {
    logger.error("Error getting account address:", accountError);
    const details = accountError
      ? `Account retrieval failed: ${errorToString(accountError, 200)}`
      : "No account address found. Please ensure your wallet is properly connected.";
    return createValidationError(
      ValidationErrorType.ACCOUNT_ERROR,
      details,
      ValidationField.FORM,
    );
  }

  if (!publicKey) {
    logger.error("No public key available", new Error("No public key"));
    return createValidationError(
      ValidationErrorType.ACCOUNT_ERROR,
      "No public key available. Please ensure your wallet is properly connected.",
      ValidationField.FORM,
    );
  }

  const senderPubKey = await publicKey;

  const [balanceError, currentBalance] = await tryAsync(
    token.getBalance(warpCore.multiProvider, address),
  );

  if (balanceError) {
    logger.error("Error getting token balance:", balanceError);
    return createValidationError(
      ValidationErrorType.TOKEN_ERROR,
      `Failed to fetch balance: ${errorToString(balanceError, 200)}. Please try again.`,
      ValidationField.FORM,
    );
  }

  if (!destination) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      "Destination chain is required",
      ValidationField.FORM,
    );
  }

  const maxTransferAmountParams = {
    balance: currentBalance,
    destination,
    sender: address,
    senderPubKey,
  };

  const [maxAmountError, maxTransferAmount] = await tryAsync(
    warpCore.getMaxTransferAmount(maxTransferAmountParams),
  );

  if (maxAmountError) {
    logger.error("Error getting max transfer amount:", maxAmountError);
    return createValidationError(
      ValidationErrorType.TOKEN_ERROR,
      `Failed to calculate maximum transfer amount: ${errorToString(maxAmountError, 200)}. Please try again.`,
      ValidationField.FORM,
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
      ValidationErrorType.INSUFFICIENT_FUNDS,
      `Amount exceeds maximum transferable: ${formattedAmount} ${token.symbol}. Maximum is ${formattedMaxAmount} ${token.symbol} (including gas fees). Use "Max" button or enter a smaller amount.`,
      ValidationField.AMOUNT,
    );
  }

  if (!recipient) {
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      "Recipient is required",
      ValidationField.FORM,
    );
  }

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
      VALIDATION_REGEX.INSUFFICIENT_FUNDS.test(fullErrorMessage) ||
      VALIDATION_REGEX.EMPTY_ACCOUNT.test(fullErrorMessage)
    ) {
      const [balanceError, currentBalance] = await tryAsync(
        token.getBalance(warpCore.multiProvider, address),
      );

      if (balanceError) {
        logger.error("Error getting token balance:", balanceError);
        return createValidationError(
          ValidationErrorType.TOKEN_ERROR,
          `Failed to fetch balance: ${errorToString(balanceError, 200)}. Please try again.`,
          ValidationField.FORM,
        );
      }

      const formattedBalance = currentBalance.getDecimalFormattedAmount();
      const formattedAmount = token
        .amount(amountWei)
        .getDecimalFormattedAmount();

      return createValidationError(
        ValidationErrorType.INSUFFICIENT_FUNDS,
        `Insufficient balance: You have ${formattedBalance} ${token.symbol} and are trying to transfer ${formattedAmount} ${token.symbol}. Please adjust the amount and try again.`,
        ValidationField.FORM,
      );
    }

    if (VALIDATION_REGEX.GAS_ESTIMATION.test(fullErrorMessage)) {
      return createValidationError(
        ValidationErrorType.GAS_ESTIMATION,
        `Gas estimation failed: ${detailedError}. Please ensure you have enough ETH to cover the gas fees on the origin chain.`,
        ValidationField.FORM,
      );
    }

    if (VALIDATION_REGEX.BASE_ETH_INSUFFICIENT.test(fullErrorMessage)) {
      return createValidationError(
        ValidationErrorType.BASE_ETH_INSUFFICIENT,
        `Insufficient ETH on Base: ${detailedError}. You need ETH on Base to pay for transaction gas fees when bridging from Base. Please add some ETH to your Base wallet.`,
        ValidationField.FORM,
      );
    }

    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `Transfer validation failed: ${detailedError}. Please check your inputs and try again.`,
      ValidationField.FORM,
    );
  }

  return result ?? {};
}
