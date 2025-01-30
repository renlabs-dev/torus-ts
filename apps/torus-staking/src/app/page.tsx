import { Suspense } from "react";
import { Loading } from "@torus-ts/ui";
import { SidebarLinks } from "./components/sidebar-links";
import WalletActions from "./components/wallet-actions";
import { WalletBalance } from "./components/wallet-balance";
import { HeroSection } from "./components/hero-section";

export default function Page(): JSX.Element {
  return (
    <Suspense fallback={<Loading />}>
      <main className="flex min-w-full flex-col items-center text-white">
        <div className="w-screen">
          <HeroSection />
        </div>
        <div className="mx-auto mt-16 flex w-full max-w-7xl flex-col justify-around gap-6 px-4 lg:flex-row">
          <div className="flex w-full animate-fade flex-col gap-4 lg:w-3/12">
            <SidebarLinks />
            <WalletBalance />
          </div>
          <div className="flex w-full flex-col lg:w-9/12">
            <WalletActions />
          </div>
        </div>
      </main>
    </Suspense>
  );
}
