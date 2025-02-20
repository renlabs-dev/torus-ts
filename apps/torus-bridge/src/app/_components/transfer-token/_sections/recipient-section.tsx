import { TokenBalance } from "../_components/token-balance";
import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";
import { toast } from "@torus-ts/toast-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Label } from "@torus-ts/ui/components/label";
import { useFormikContext } from "formik";
import { TextField } from "~/app/_components/text-field";
import { useDestinationBalance } from "~/hooks/balance/use-destination-balance";
import { useChainDisplayName } from "~/hooks/chain/use-chain-display-name";
import { useRecipientBalanceWatcher } from "~/hooks/use-balance-watcher";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { TransferFormValues } from "~/utils/types";

export function RecipientSection({
  isReview,
}: Readonly<{ isReview: boolean }>) {
  const { values } = useFormikContext<TransferFormValues>();
  const { balance } = useDestinationBalance(values);
  useRecipientBalanceWatcher(values.recipient, balance);

  return (
    <div className="mt-4">
      <div className="flex justify-between pb-2 pr-1">
        <Label>Recipient address</Label>
        <TokenBalance label="Remote balance" balance={balance} />
      </div>
      <div className="flex w-full items-center gap-2">
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

function SelfButton({ disabled }: Readonly<{ disabled?: boolean }>) {
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
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant="outline"
    >
      Self
    </Button>
  );
}
