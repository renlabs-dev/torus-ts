import DashboardInfoCards from "./dashboard-info-cards";
import DashboardPendingDaoApplicationsCard from "./dashboard-pending-dao-applications-card";

export default function DashboardTab() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <DashboardInfoCards />
      <DashboardPendingDaoApplicationsCard />
    </div>
  );
}
