import { useFormikContext } from "formik";

import type { TransferFormValues } from "~/utils/types";
import { useRecipientBalanceWatcher } from "~/hooks/use-balance-watcher";

import { TextField } from "~/app/_components/text-field";

import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";
import { toast } from "@torus-ts/toast-provider";
import { SolidButton } from "~/app/_components/buttons/solid-button";
import { TokenBalance } from "../_components/token-balance";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useDestinationBalance } from "~/hooks/balance/use-destination-balance";

export function RecipientSection({ isReview }: { isReview: boolean }) {
  const { values } = useFormikContext<TransferFormValues>();
  const { balance } = useDestinationBalance(values);
  useRecipientBalanceWatcher(values.recipient, balance);

  return (
    <div className="mt-4">
      <div className="flex justify-between pr-1">
        <label
          htmlFor="recipient"
          className="block pl-0.5 text-sm text-gray-600"
        >
          Recipient address
        </label>
        <TokenBalance label="Remote balance" balance={balance} />
      </div>
      <div className="relative w-full">
        <TextField
          name="recipient"
          placeholder="0x123456..."
          className="w-full"
          disabled={isReview}
        />
        <SelfButton disabled={isReview} />
      </div>
    </div>
  );
}

function SelfButton({ disabled }: { disabled?: boolean }) {
  const { values, setFieldValue } = useFormikContext<TransferFormValues>();
  const multiProvider = useMultiProvider();
  const chainDisplayName = useChainDisplayName(values.destination);
  const address = useAccountAddressForChain(multiProvider, values.destination);
  const onClick = () => {
    if (disabled) return;
    if (address) void setFieldValue("recipient", address);
    else
      toast.warn(
        `No account found for for chain ${chainDisplayName}, is your wallet connected?`,
      );
  };
  return (
    <SolidButton
      type="button"
      onClick={onClick}
      color="primary"
      disabled={disabled}
      classes="text-xs absolute right-1 top-2.5 bottom-1 px-2 opacity-90 all:rounded"
    >
      Self
    </SolidButton>
  );
}
