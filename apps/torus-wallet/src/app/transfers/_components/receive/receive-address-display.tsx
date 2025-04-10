import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Copy } from "lucide-react";

interface ReceiveAddressDisplayProps {
  address: string;
}

export function ReceiveAddressDisplay({ address }: ReceiveAddressDisplayProps) {
  const { toast } = useToast();

  const handleCopyAddress = async (address: string) => {
    await copyToClipboard(address);

    toast({
      title: "Success!",
      description: "Address Copied to clipboard",
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full mt-2">
      <div className="p-3 bg-muted rounded-md w-full text-center break-all">
        <code>{address}</code>
      </div>
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          onClick={() => handleCopyAddress(address)}
          className="w-full flex items-center justify-center gap-2"
        >
          <Copy size={16} />
          Copy Address
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        Connected account: {smallAddress(address)}
      </span>
    </div>
  );
}
