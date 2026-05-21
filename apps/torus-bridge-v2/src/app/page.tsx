"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

export default function Page() {
  const { api, selectedAccount } = useTorus();

  // @functor-flow -> example of using a function that comes from the sdk `queryFreeBalance()`
  // but its adapted to react-query through the `query-provider` package as `useFreeBalance()`
  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-lg items-center justify-center">
      Free balance:{" "}
      {accountFreeBalance.data
        ? formatToken(accountFreeBalance.data) + " TORURURURUS"
        : "Connect wallet r3trd"}
    </main>
  );
}
