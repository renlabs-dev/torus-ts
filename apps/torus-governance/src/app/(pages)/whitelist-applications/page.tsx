import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { FilterContent } from "../../_components/filter-content";
import { ShapeNetworkModal } from "../../_components/shape-network-modal";
import { ListWhitelistApplications } from "./_components/list-whitelist-applications";

export const metadata = createSeoMetadata({
  title: "Whitelist Applications - Torus Governance",
  description: "Review and vote on agent whitelist applications. Manage network participation by evaluating agent applications for the Torus Network.",
  keywords: ["whitelist applications", "agent applications", "network participation", "agent approval", "governance review"],
  ogSiteName: "Torus Governance",
  canonical: "/whitelist-applications",
  baseUrl: env("BASE_URL"),
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
