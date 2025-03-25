import WalletActions from "./components/wallet-actions";
import { WalletSkeletonLoader } from "./components/wallet-skeleton-loader";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<WalletSkeletonLoader />}>
      <WalletActions route="transfer" />
    </Suspense>
  );
}
