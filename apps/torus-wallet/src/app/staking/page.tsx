import { Suspense } from "react";

import WalletActions from "../components/wallet-actions";
import { WalletSkeletonLoader } from "../components/wallet-skeleton-loader";

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <WalletActions route="staking" />
    </Suspense>
  );
}
