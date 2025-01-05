import type { WarpCore } from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import { toWei, errorToString } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { getTokenByIndex } from "~/features/tokens/hooks";
import type { TransferFormValues } from "~/utils/types";
import { logger } from "~/utils/logger";

const insufficientFundsErrMsg = /insufficient.[funds|lamports]/i;
const emptyAccountErrMsg = /AccountNotFound/i;

export async function validateForm(
  warpCore: WarpCore,
  values: TransferFormValues,
  accounts: Record<ProtocolType, AccountInfo>,
) {
  try {
    const { origin, destination, tokenIndex, amount, recipient } = values;
    const token = getTokenByIndex(warpCore, tokenIndex);
    if (!token) return { token: "Token is required" };
    const amountWei = toWei(amount, token.decimals);
    const { address, publicKey: senderPubKey } = getAccountAddressAndPubKey(
      warpCore.multiProvider,
      origin,
      accounts,
    );
    const result = await warpCore.validateTransfer({
      originTokenAmount: token.amount(amountWei),
      destination,
      recipient,
      sender: address ?? "",
      senderPubKey: await senderPubKey,
    });
    return result;
  } catch (error) {
    logger.error("Error validating form", error);
    let errorMsg = errorToString(error, 40);
    const fullError = `${errorMsg} ${(error as Error).message}`;
    if (
      insufficientFundsErrMsg.test(fullError) ||
      emptyAccountErrMsg.test(fullError)
    ) {
      errorMsg = "Insufficient funds for gas fees";
    }
    return { form: errorMsg };
  }
}
