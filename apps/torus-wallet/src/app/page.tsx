import { Suspense } from "react";

import { env } from "~/env";

import { Loading } from "@torus-ts/ui";

import { IntroSection } from "./components/intro";
import { SidebarLinks } from "./components/sidebar-links";
import WalletActions from "./components/wallet-actions";
import { WalletBalance } from "./components/wallet-balance";

export default function Page(): JSX.Element {
  console.log(env.NEXT_PUBLIC_TORUS_RPC_URL);
  console.log(env.NEXT_PUBLIC_TORUS_CACHE_URL);

  return (
    <Suspense fallback={<Loading />}>
      <main className="mx-auto flex min-w-full flex-col items-center gap-3 text-white">
        <IntroSection />
        <div className="flex w-full flex-col justify-around gap-6 py-10 lg:mt-[20vh] lg:flex-row">
          <div className="flex w-full animate-fade flex-col gap-4 lg:w-4/12">
            <SidebarLinks />
            <WalletBalance />
          </div>
          <WalletActions />
        </div>
      </main>
    </Suspense>
  );
}
