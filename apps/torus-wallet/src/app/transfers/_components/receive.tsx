import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Copy } from "lucide-react";
import { useWallet } from "~/context/wallet-provider";

export function Receive() {
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
    <Card
      className="flex flex-col items-start justify-center gap-4 p-6 shadow-md hover:shadow-lg
        transition-shadow duration-300"
    >
      <h3 className="text-lg font-semibold">Receive TORUS</h3>
      <p className="text-left text-muted-foreground">
        Share your address with the sender to receive TORUS.
      </p>

      {selectedAccount?.address ? (
        <div className="flex flex-col items-center justify-center gap-3 w-full mt-2">
          <div className="p-3 bg-muted rounded-md w-full text-center break-all">
            <code>{selectedAccount.address}</code>
          </div>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => handleCopyAddress(selectedAccount.address)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Copy size={16} />
              Copy Address
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">
            Connected account: {smallAddress(selectedAccount.address)}
          </span>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center p-4 border border-dashed rounded-md
            border-muted-foreground w-full"
        >
          <span className="text-muted-foreground">
            Connect your wallet to view your address
          </span>
        </div>
      )}
    </Card>
  );
}
