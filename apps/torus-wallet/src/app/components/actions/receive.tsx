import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { useWallet } from "~/context/wallet-provider";

export function ReceiveAction() {
  const { selectedAccount } = useWallet();
  const { toast } = useToast();
  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);
    toast({
      title: "Success!",
      description: "Address Copied to clipboard",
    });
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
