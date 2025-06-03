import { FilterContent } from "../../_components/filter-content";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { ShapeNetworkModal } from "../../_components/shape-network-modal";
import { env } from "~/env";
import { ListWhitelistApplications } from "./_components/list-whitelist-applications";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus DAO - Agent Whitelist Applications",
    description: "Review and vote on agent whitelist applications for the Torus Network. Help determine which agents can participate in the network's consensus.",
    keywords: ["agent applications", "torus whitelist", "agent whitelist", "torus agents", "blockchain agent applications"],
    baseUrl: env("BASE_URL"),
    canonical: "/whitelist-applications",
  });

export default function HomePage() {
  return (
    <div className="flex w-full flex-col gap-4 pb-16 animate-fade">
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

      <ListWhitelistApplications />
    </div>
  );
}
