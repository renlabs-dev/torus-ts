import DashboardAgentHealthCard from "./dashboard-agent-health-card";
import DashboardInfoCards from "./dashboard-info-cards";
import DashboardPendingDaoMemberCard from "./dashboard-pending-dao-member-card";
import DashboardPendingWhitelistCard from "./dashboard-pending-whitelist-card";

export default function DashboardTab() {
  return (
    <div className="animate-fade flex flex-col gap-4 pt-2">
      <DashboardInfoCards />
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-col gap-4 md:w-[65%]">
          <DashboardPendingWhitelistCard />
          <DashboardPendingDaoMemberCard />
        </div>
        <div className="md:w-[35%]">
          <DashboardAgentHealthCard />
        </div>
      </div>
    </div>
  );
}
