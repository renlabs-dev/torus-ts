import { GuideDialog } from "../_components/guide-dialog";
import { SelectActionDialog } from "../_components/select-action-dialog";
import { SidebarLinks } from "../_components/shared/sidebar-links";
import { WalletBalance } from "../_components/shared/wallet-balance";
import { SimpleBridge } from "../_components/simple-bridge";
import { TransferDetails } from "../_components/transfer-details";

export function generateMetadata() {
  return {
    title: "Simple Bridge - Torus Network",
    description: "Transfer TORUS tokens between Base and Native chains in one seamless flow",
  };
}

export default function SimpleBridgePage() {
  return (
    <main className="mx-auto flex min-w-full flex-col items-start gap-3 text-white lg:mt-[calc(20vh-64px)]">
      <TransferDetails />
      <div className="mb-4 mt-12 flex w-full flex-col gap-6 md:mt-0 md:flex-row">
        <SelectActionDialog />
        <GuideDialog />
      </div>
      <div className="flex w-full flex-col justify-around gap-6 lg:flex-row">
        <div className="animate-fade flex w-full flex-col gap-4 lg:w-4/12">
          <SidebarLinks />
          <WalletBalance />
        </div>
        <div className="flex w-full flex-col gap-6">
          <SimpleBridge />
        </div>
      </div>
    </main>
  );
}