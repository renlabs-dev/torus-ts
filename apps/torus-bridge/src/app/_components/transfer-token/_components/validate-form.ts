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

export async function validateForm(
  warpCore: WarpCore,
  values: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
) {
  const { origin, destination, tokenIndex, amount, recipient } = values;

  // Get token
  const [tokenError, token] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );

  if (tokenError !== undefined) {
    logger.error("Error getting token:", tokenError);
    return { form: errorToString(tokenError, 40) };
  }

  if (!token) return { token: "Token is required" };

  // Convert amount to Wei
  const [amountError, amountWei] = trySync(() => toWei(amount, token.decimals));

  if (amountError !== undefined) {
    logger.error("Error converting amount to wei:", amountError);
    return { amount: "Invalid amount" };
  }

  // Get account address and public key
  const [accountError, accountSuccess] = trySync(() =>
    getAccountAddressAndPubKey(warpCore.multiProvider, origin, accounts),
  );

  if (accountError !== undefined) {
    logger.error("Error getting account address and public key:", accountError);
    return { form: "Error retrieving account information" };
  }

  const { address, publicKey: senderPubKey } = accountSuccess;

  if (!address || !senderPubKey) {
    return { form: "Error retrieving account information" };
  }

  // Get sender public key
  const [pubKeyError, resolvedPubKey] = await tryAsync(senderPubKey);

  if (pubKeyError !== undefined) {
    logger.error("Error resolving sender public key:", pubKeyError);
    return { form: "Error retrieving account keys" };
  }

  // Validate transfer
  const [validateError, result] = await tryAsync(
    warpCore.validateTransfer({
      originTokenAmount: token.amount(amountWei),
      destination,
      recipient,
      sender: address,
      senderPubKey: resolvedPubKey,
    }),
  );

  if (validateError !== undefined) {
    logger.error("Error validating transfer:", validateError);

    let errorMsg = errorToString(validateError, 40);
    const fullError = `${errorMsg} ${validateError.message}`;

    if (
      insufficientFundsErrMsg.test(fullError) ||
      emptyAccountErrMsg.test(fullError)
    ) {
      errorMsg = "Insufficient funds for gas fees";
    }

    return { form: errorMsg };
  }

  return result;
}
