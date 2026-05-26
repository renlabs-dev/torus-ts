"use client";

import { Button } from "@torus-ts/ui/components/button";
import { CheckCircle } from "lucide-react";
import { useDisconnect } from "wagmi";

export function AlreadyClaimedNotice({ amount }: Readonly<{ amount: string }>) {
  const { disconnect } = useDisconnect();

  return (
    <div className="flex flex-col items-center gap-3 py-4 text-sm">
      <CheckCircle className="h-8 w-8 text-green-500" />
      <p className="font-medium">Tokens already claimed</p>
      <p className="text-muted-foreground text-center">
        {amount} TORUS was claimed for this address.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
      >
        Disconnect to try another wallet
      </Button>
    </div>
  );
}
