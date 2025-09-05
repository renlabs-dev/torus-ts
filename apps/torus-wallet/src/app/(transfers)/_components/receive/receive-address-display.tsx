import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { copyToClipboard } from "@torus-ts/ui/lib/utils";
import { Copy } from "lucide-react";

interface ReceiveAddressDisplayProps {
  address: string;
}

export function ReceiveAddressDisplay({ address }: ReceiveAddressDisplayProps) {
  const { toast } = useToast();

  const handleCopyAddress = async (address: string) => {
    const [error, _success] = await tryAsync(copyToClipboard(address));
    if (error !== undefined) {
      toast.error("Failed to copy address, please, try again.");
      return;
    }
    toast.success("Address Copied to clipboard");
  };

  return (
    <div className="mt-2 flex w-full flex-col items-center justify-center gap-3">
      <div className="bg-muted w-full break-all rounded-md p-3 text-center">
        <code>{address}</code>
      </div>
      <div className="flex w-full gap-2">
        <Button
          variant="outline"
          onClick={() => handleCopyAddress(address)}
          className="flex w-full items-center justify-center gap-2"
        >
          <Copy size={16} />
          Copy Address
        </Button>
      </div>
      <span className="text-muted-foreground text-xs">
        Connected account: {smallAddress(address)}
      </span>
    </div>
  );
}
