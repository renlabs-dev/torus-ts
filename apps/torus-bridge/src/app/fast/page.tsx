import { SidebarLinks } from "../_components/shared/sidebar-links";
import { WalletBalance } from "../_components/shared/wallet-balance";
import { FastBridge } from "./_components/fast-bridge";

export function generateMetadata() {
  return {
    title: "Fast Bridge - Torus",
    description:
      "Transfer TORUS tokens between Base and Torus chains in one seamless flow",
  };
}

export default function FastBridgePage() {
  return (
    <main className="mx-auto flex min-w-full flex-col items-start gap-3 text-white lg:mt-[calc(20vh-64px)]">
      <div className="flex w-full flex-col justify-around gap-6 lg:flex-row">
        <div className="animate-fade flex w-full flex-col gap-4 lg:w-4/12">
          <SidebarLinks />
          <WalletBalance />
        </div>
        <div className="flex w-full flex-col gap-6">
          <FastBridge />
        </div>
      </div>
    </main>
  );
}
