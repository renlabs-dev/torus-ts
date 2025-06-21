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

export function validateFormSync(
  values: TransferFormValues,
): Record<string, string> | undefined {
  const errors: Record<string, string> = {};

  // Validate all required fields
  const validations = [
    { field: "recipient", value: values.recipient, name: "Recipient address" },
    { field: "amount", value: values.amount, name: "Amount" },
    { field: "origin", value: values.origin, name: "Origin chain" },
    {
      field: "destination",
      value: values.destination,
      name: "Destination chain",
    },
  ];

  for (const { field, value, name } of validations) {
    const error = validateRequiredField(value, name);
    if (error) errors[field] = error;
  }

  // Special validation for amount
  if (values.amount && !errors.amount) {
    const positiveError = validatePositiveNumber(values.amount, "Amount");
    if (positiveError) errors.amount = positiveError;
  }

  // Special validation for tokenIndex
  if (values.tokenIndex === undefined) {
    errors.tokenIndex = "Token selection is required";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

export function validateForm(
  _warpCore: WarpCore,
  values: TransferFormValues,
  _accounts: Record<ProtocolType, AccountInfo>,
): ValidationResult {
  const errors = validateFormSync(values);

  if (errors) {
    const firstError = Object.values(errors)[0];
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `${firstError}. Please fix the error and try again.`,
      ValidationField.FORM,
    );
  }

  return {};
}

export async function validateFormWithBalance(
  warpCore: WarpCore,
  values: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
): Promise<ValidationResult> {
  // Basic validation first
  const basicErrors = validateFormSync(values);
  if (basicErrors) {
    const firstError = Object.values(basicErrors)[0];
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      firstError,
      ValidationField.FORM,
    );
  }

  const { origin, destination, tokenIndex, amount, recipient } = values;

  // Token validation
  const token = getTokenByIndex(warpCore, tokenIndex);
  if (!token) {
    logger.error("Token configuration not found", new Error("Token not found"));
    return createValidationError(
      ValidationErrorType.TOKEN_ERROR,
      "Token configuration not found",
      ValidationField.FORM,
    );
  }

  // Amount conversion
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
    return createValidationError(
      ValidationErrorType.VALIDATION_ERROR,
      `Amount conversion failed: ${errorToString(amountError, 200)}. Please check your input format.`,
      ValidationField.AMOUNT,
    );
  }

  // Account validation
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

  // Balance validation
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

  // Max transfer amount validation
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

  // Balance check
  if (BigInt(amountWei) > maxTransferAmount.amount) {
    const formattedAmount = token.amount(amountWei).getDecimalFormattedAmount();
    const formattedMaxAmount = maxTransferAmount.getDecimalFormattedAmount();

    return createValidationError(
      ValidationErrorType.INSUFFICIENT_FUNDS,
      `Amount exceeds maximum transferable: ${formattedAmount} ${token.symbol}. Maximum is ${formattedMaxAmount} ${token.symbol} (including gas fees). Use "Max" button or enter a smaller amount.`,
      ValidationField.AMOUNT,
    );
  }

  // Final transfer validation
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

    // Handle specific error types
    if (
      VALIDATION_REGEX.INSUFFICIENT_FUNDS.test(fullErrorMessage) ||
      VALIDATION_REGEX.EMPTY_ACCOUNT.test(fullErrorMessage)
    ) {
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
