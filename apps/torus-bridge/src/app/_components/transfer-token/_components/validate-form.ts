import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { errorToString, toWei } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { getTokenByIndex } from "~/hooks/token";
import { logger } from "~/utils/logger";
import type { TransferFormValues } from "~/utils/types";

const insufficientFundsErrMsg = /insufficient.[funds|lamports]/i;
const emptyAccountErrMsg = /AccountNotFound/i;
const gasEstimationErrMsg = /gas.*(estimation|required)/i;
const baseEthInsufficientErrMsg = /insufficient.*eth/i;

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

export async function validateForm(
  warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
): Promise<ValidationError | Record<string, unknown>> {
  const [tokenError, token] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );
  if (tokenError || !token) {
    logger.error("Error getting token:", tokenError);
    const details = tokenError
      ? `Token retrieval failed: ${errorToString(tokenError, 200)}`
      : "Token configuration not found";
    return {
      form: "Error",
      details,
      errorType: "token_error" as const,
    };
  }

  const [amountError, amountWei] = trySync(() => toWei(amount, token.decimals));
  if (amountError) {
    logger.error("Error converting amount to wei:", amountError);
    const details = `Amount conversion failed: ${errorToString(amountError, 200)}. Please check your input format.`;
    return {
      amount: "Invalid amount",
      details,
      errorType: "validation_error" as const,
    };
  }

  const [accountError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(warpCore.multiProvider, origin, accounts),
  );
  if (accountError || !address) {
    logger.error("Error getting account address:", accountError);
    const details = accountError
      ? `Account retrieval failed: ${errorToString(accountError, 200)}`
      : "No account address found. Please ensure your wallet is properly connected.";
    return {
      form: "Error",
      details,
      errorType: "account_error" as const,
    };
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
    const fullError = `${errorMsg} ${validateError.message}`;
    const detailedError = errorToString(validateError, 500);

    if (
      insufficientFundsErrMsg.test(fullError) ||
      emptyAccountErrMsg.test(fullError)
    ) {
      const [balanceError, currentBalance] = await tryAsync(
        token.getBalance(warpCore.multiProvider, address),
      );
      if (balanceError) {
        logger.error("Error getting token balance:", balanceError);
        return {
          form: "Error",
          details: `Failed to fetch balance: ${errorToString(balanceError, 200)}. Please try again.`,
          errorType: "token_error" as const,
        } as ValidationError;
      }
      const formattedBalance = currentBalance.getDecimalFormattedAmount();
      const formattedAmount = token
        .amount(amountWei)
        .getDecimalFormattedAmount();

      return {
        form: "Error",
        details: `Insufficient balance: You have ${formattedBalance} ${token.symbol} and are trying to transfer ${formattedAmount} ${token.symbol}. Please adjust the amount and try again.`,
        errorType: "insufficient_funds" as const,
      } as ValidationError;
    }

    if (gasEstimationErrMsg.test(fullError)) {
      return {
        form: "Error",
        details: `Gas estimation failed: ${detailedError}. Please ensure you have enough ETH to cover the gas fees on the origin chain.`,
        errorType: "gas_estimation" as const,
      } as ValidationError;
    }

    if (baseEthInsufficientErrMsg.test(fullError)) {
      return {
        form: "Error",
        details: `Insufficient ETH on Base: ${detailedError}. You need ETH on Base to pay for transaction gas fees when bridging from Base. Please add some ETH to your Base wallet.`,
        errorType: "base_eth_insufficient" as const,
      } as ValidationError;
    }

    return {
      form: "Error",
      details: `Transfer validation failed: ${detailedError}. Please check your inputs and try again.`,
      errorType: "validation_error" as const,
    } as ValidationError;
  }

  return result as ValidationError | Record<string, unknown>;
}
