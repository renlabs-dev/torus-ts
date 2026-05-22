"use client";

import { useDisconnect } from "wagmi";

export function NotEligibleNotice() {
  const { disconnect } = useDisconnect();

  return (
    <div className="flex flex-col gap-2 py-2 text-sm">
      <p className="font-medium">Not eligible</p>
      <p className="text-muted-foreground">
        This address is not in the migration snapshot.{" "}
        <button
          type="button"
          onClick={() => disconnect()}
          className="hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Disconnect wallet
        </button>{" "}
        to try a different address.
      </p>
    </div>
  );
}
