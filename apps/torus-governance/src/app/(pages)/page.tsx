import { FilterContent } from "../_components/filter-content";
import { CreateModal } from "../_components/modal";
import { ListAgentApplications } from "../_components/render-list/list-agent-applications";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterContent />
        <CreateModal />
      </div>
      <ListAgentApplications />
    </div>
  );
}