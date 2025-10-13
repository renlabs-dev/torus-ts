import { SidebarLinks } from "../_components/shared/sidebar-links";
import { WalletBalance } from "../_components/shared/wallet-balance";
import { SimpleBridge } from "./_components/simple-bridge";

/**
 * Provide metadata for the page.
 *
 * @returns An object containing `title` and `description` for the page metadata
 */
export function generateMetadata() {
  return {
    title: "Simple Bridge - Torus Network",
    description:
      "Transfer TORUS tokens between Base and Native chains in one seamless flow",
  };
}

/**
 * Renders the Simple Bridge page layout.
 *
 * The layout arranges a left column with navigation and wallet balance alongside a main column containing the bridge UI; it adapts between column and row layouts at the large breakpoint.
 *
 * @returns The page's JSX element containing the sidebar links, wallet balance, and SimpleBridge content
 */
export default function SimpleBridgePage() {
  return (
    <main className="mx-auto flex min-w-full flex-col items-start gap-3 text-white lg:mt-[calc(20vh-64px)]">
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