import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { FilterContent } from "../../_components/filter-content";
import { ShapeNetworkModal } from "../../_components/shape-network-modal";
import { ListWhitelistApplications } from "./_components/list-whitelist-applications";

export default function HomePage() {
  return (
    <div className="flex w-full flex-col gap-4 pb-16">
      <div className="flex w-full flex-col justify-between gap-3 pb-2 lg:flex-row">
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
        <ShapeNetworkModal />
      </div>
      <ScrollArea className="sm:max-h-[calc(100vh-15.9rem)]">
        <div className="flex flex-col gap-4">
          <ListWhitelistApplications />
        </div>
      </ScrollArea>
    </div>
  );
}
