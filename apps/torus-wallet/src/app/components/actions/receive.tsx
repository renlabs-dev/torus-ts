import { toast } from "@torus-ts/toast-provider";
import { Button, Card } from "@torus-ts/ui";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { useWallet } from "~/context/wallet-provider";

export function ReceiveAction() {
  const { selectedAccount } = useWallet();
  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);
    toast.success("Address copied to clipboard");
  };
  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-6">
      <p>To receive TORUS, share your address with the sender.</p>
      {selectedAccount?.address ? (
        <div className="flex flex-col items-center justify-center gap-2">
          <span className="text-muted-foreground">
            Connected account: {smallAddress(selectedAccount.address)}
          </span>
          <Button
            variant="outline"
            onClick={() => handleCopyAddress(selectedAccount.address)}
            className="btn btn-primary"
          >
            Copy Wallet Address
          </Button>
        </div>
      ) : (
        <span className="text-muted-foreground">
          Connect your wallet to view your address
        </span>
      )}
    </Card>
  );
}
