import { Card } from "@torus-ts/ui/components/card";
import { useWallet } from "~/context/wallet-provider";
import { ReceiveAddressDisplay } from "./receive-address-display";

export function Receive() {
  const { selectedAccount } = useWallet();

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
        <ReceiveAddressDisplay address={selectedAccount.address} />
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