import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { errorToString, toWei } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { getTokenByIndex } from "~/hooks/token";
import { isPromise } from "~/utils/helpers";
import { logger } from "~/utils/logger";
import type { TransferFormValues } from "~/utils/types";

const insufficientFundsErrMsg = /insufficient.[funds|lamports]/i;
const emptyAccountErrMsg = /AccountNotFound/i;

export async function validateForm(
  warpCore: WarpCore,
  { origin, destination, tokenIndex, amount, recipient }: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
) {
  const [tokenError, token] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );
  if (tokenError || !token) {
    logger.error("Error getting token:", tokenError);
    return {
      form: tokenError ? errorToString(tokenError, 40) : "Token is required",
    };
  }

  const [amountError, amountWei] = trySync(() => toWei(amount, token.decimals));
  if (amountError) {
    logger.error("Error converting amount to wei:", amountError);
    return { amount: "Invalid amount" };
  }

  const [accountError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(warpCore.multiProvider, origin, accounts),
  );
  if (accountError || !address) {
    logger.error("Error getting account address:", accountError);
    return { form: "Error retrieving account information" };
  }

  const [senderPubKeyErr, senderPubKey] = isPromise(publicKey)
    ? await tryAsync(publicKey)
    : [undefined, publicKey];
  if (senderPubKeyErr) {
    logger.warn("Error getting sender public key:", senderPubKeyErr);
    return { form: "Error retrieving account information" };
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
    const fullError = `${errorMsg} ${validateError.message}`;
    return {
      form:
        insufficientFundsErrMsg.test(fullError) ||
        emptyAccountErrMsg.test(fullError)
          ? "Insufficient funds for gas fees"
          : errorMsg,
    };
  }

  return result;
}
