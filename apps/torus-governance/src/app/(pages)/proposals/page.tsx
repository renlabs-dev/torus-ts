import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { FilterContent } from "../../_components/filter-content";
import { ShapeNetworkModal } from "../../_components/shape-network-modal";
import { ListProposals } from "./_components/list-proposals";

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
