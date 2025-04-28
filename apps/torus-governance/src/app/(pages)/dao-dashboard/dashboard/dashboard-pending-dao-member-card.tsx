import { UserRound } from "lucide-react";
import DashboardRedirectCard from "./dashboard-redirect-card";

export default function DashboardPendingDaoMemberCard() {
  return (
    <DashboardRedirectCard
      redirectPath="#"
      icon={UserRound}
      title="Pending DAO Member Applications"
    >
      <div className="flex flex-col items-start justify-center p-5 gap-2">
        <p className="text-sm text-muted-foreground uppercase font-bold">
          Pending DAO Member Applications
        </p>
        <h3 className="text-3xl font-bold mt-1">0</h3>
      </div>
    </DashboardRedirectCard>
  );
}
