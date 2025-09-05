"use client";

import { Card } from "@torus-ts/ui/components/card";
import { useWallet } from "~/context/wallet-provider";
import { ReceiveAddressDisplay } from "./receive-address-display";

export function Receive() {
  const { selectedAccount } = useWallet();

  return (
    <Card className="flex flex-col items-start justify-center gap-4 p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
      <h3 className="text-lg font-semibold">Receive TORUS</h3>
      <p className="text-muted-foreground text-left">
        Share your address with the sender to receive TORUS.
      </p>

      {selectedAccount?.address ? (
        <ReceiveAddressDisplay address={selectedAccount.address} />
      ) : (
        <div className="border-muted-foreground flex w-full flex-col items-center justify-center rounded-md border border-dashed p-4">
          <span className="text-muted-foreground">
            Connect your wallet to view your address
          </span>
        </div>
      )}
    </Card>
  );
}
