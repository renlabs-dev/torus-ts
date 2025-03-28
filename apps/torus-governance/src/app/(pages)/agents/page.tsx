import { FilterContent } from "../../_components/filter-content";
import { ListAgents } from "../../_components/render-list/list-agents";

export default function AgentsPage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterContent />
      </div>
      <ListAgents />
    </div>
  );
}
