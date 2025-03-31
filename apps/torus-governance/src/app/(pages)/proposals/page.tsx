import { FilterContent } from "../../_components/filter-content";
import { CreateModal } from "../../_components/modal";
import { ListProposals } from "../../_components/render-list/list-proposals";

export default function ProposalsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterContent 
          placeholder="Search proposals..."
          statusParamName="status"
        />
        <CreateModal />
      </div>
      <ListProposals />
    </div>
  );
}
