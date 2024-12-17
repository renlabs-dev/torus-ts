import { Suspense } from "react";

import { Loading } from "@torus-ts/ui";

import { IntroSection } from "./components/intro";
import { SidebarLinks } from "./components/sidebar-links";
import WalletActions from "./components/wallet-actions";
import { WalletBalance } from "./components/wallet-balance";

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <main className="md:px-6 relative mx-auto flex h-screen min-w-full flex-col items-center gap-3 px-4 text-white">
        <IntroSection />
        <div className="lg:mt-[20vh] lg:flex-row mt-32 flex w-full flex-col justify-around gap-6">
          <div className="lg:w-4/12 flex w-full animate-fade flex-col gap-4">
            <SidebarLinks />
            <WalletBalance />
          </div>
          <WalletActions />
        </div>
      </main>
    </Suspense>
  );
}
