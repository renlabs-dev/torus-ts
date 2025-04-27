import DashboardAgentHealthCard from "./dashboard-agent-health-card";
import DashboardInfoCards from "./dashboard-info-cards";
import DashboardPendingDaoApplicationsCard from "./dashboard-pending-dao-applications-card";
import DashboardPendingWhitelistCard from "./dashboard-pending-whitelist-card";

export default function DashboardTab() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <DashboardInfoCards />
      <div className="flex flex-row gap-4">
        <div className="w-[65%]">
          <DashboardPendingDaoApplicationsCard />
          <DashboardPendingWhitelistCard />
        </div>
        <div className="w-[35%]">
          <DashboardAgentHealthCard />
        </div>
      </div>
    </div>
  );
}
