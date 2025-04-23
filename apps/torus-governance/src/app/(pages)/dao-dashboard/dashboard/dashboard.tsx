import DashboardInfoCards from "./dashboard-info-cards";
import DashboardPendingDaoApplicationsCard from "./dashboard-pending-dao-applications-card";

export default function DashboardTab() {
  return (
    <>
      <DashboardInfoCards />
      <DashboardPendingDaoApplicationsCard />
    </>
  );
}
