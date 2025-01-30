import { Suspense } from "react";

import { Loading } from "@torus-ts/ui";
import WalletActions from "../components/wallet-actions";

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <WalletActions route="staking" />
    </Suspense>
  );
}
