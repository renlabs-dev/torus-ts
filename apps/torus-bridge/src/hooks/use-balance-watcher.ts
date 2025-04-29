import type { TokenAmount } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useEffect, useRef } from "react";

export function useRecipientBalanceWatcher(
  recipient?: Address,
  balance?: TokenAmount,
) {
  const { toast } = useToast();
  // A crude way to detect transfer completions by triggering
  // toast on recipient balance increase. This is not ideal because it
  // could confuse unrelated balance changes for message delivery
  // TODO replace with a polling worker that queries the hyperlane explorer
  const prevRecipientBalance = useRef<{
    balance?: TokenAmount;
    recipient?: string;
  }>({
    recipient: "",
  });
  useEffect(() => {
    if (
      recipient &&
      balance &&
      prevRecipientBalance.current.balance &&
      prevRecipientBalance.current.recipient === recipient &&
      balance.token.equals(prevRecipientBalance.current.balance.token) &&
      balance.amount > prevRecipientBalance.current.balance.amount
    ) {
      toast.success(`Transfer completed to ${recipient}`);
    }

    prevRecipientBalance.current = { balance, recipient: recipient };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, recipient, prevRecipientBalance]);
}
