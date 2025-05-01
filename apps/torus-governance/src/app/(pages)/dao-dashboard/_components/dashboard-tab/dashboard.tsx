import DashboardAgentHealthCard from "./dashboard-agent-health-card";
import DashboardInfoCards from "./dashboard-info-cards";
import DashboardPendingWhitelistCard from "./dashboard-pending-whitelist-card";
import DashboardPendingDaoMemberCard from "./dashboard-pending-dao-member-card";

export default function DashboardTab() {
  return (
    <div className="flex flex-col gap-4 pt-2 animate-fade">
      <DashboardInfoCards />
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-[65%] flex flex-col gap-4">
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
