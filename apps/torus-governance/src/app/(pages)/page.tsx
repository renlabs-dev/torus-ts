import { FilterContent } from "../_components/filter-content";
import { CreateModal } from "../_components/modal";
import { ListAgentApplications } from "../_components/render-list/list-agent-applications";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col gap-4 pb-16">
      <div className="flex w-full flex-col justify-between gap-3 lg:flex-row">
        <FilterContent
          statusOptions={[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Accepted", value: "accepted" },
            { label: "Refused", value: "refused" },
            { label: "Expired", value: "expired" },
          ]}
          placeholder="Search agent applications..."
          statusParamName="whitelist-status"
          defaultStatus="all"
        />
        <CreateModal />
      </div>
      <ListAgentApplications />
    </div>
  );
}
