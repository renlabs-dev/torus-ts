import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { FilterContent } from "../../_components/filter-content";
import { ShapeNetworkModal } from "../../_components/shape-network-modal";
import { ListProposals } from "./_components/list-proposals";

export const metadata = createSeoMetadata({
  title: "Proposals - Torus Governance",
  description: "Browse and vote on network proposals. Participate in Torus Network governance by reviewing and voting on community proposals.",
  keywords: ["network proposals", "governance voting", "community proposals", "dao voting", "proposal management"],
  ogSiteName: "Torus Governance",
  canonical: "/proposals",
  baseUrl: env("BASE_URL"),
});

export default function ProposalsPage() {
  return (
    <div className="flex w-full flex-col gap-4 animate-fade">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterContent
          placeholder="Search proposals..."
          statusParamName="status"
        />
        <ShapeNetworkModal />
      </div>
      <ScrollArea className="sm:max-h-[calc(100vh-17rem)]">
        <div className="flex flex-col gap-4">
          <ListProposals />
        </div>
      </ScrollArea>
    </div>
  );
}
