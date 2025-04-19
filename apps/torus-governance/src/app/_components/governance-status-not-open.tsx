import { Card } from "@torus-ts/ui/components/card";

type GovernanceStatus = "ACCEPTED" | "REFUSED" | "REMOVED" | "EXPIRED";
interface GovernanceStatusNotOpenProps {
  governanceModel: string;
  status: GovernanceStatus;
  children?: React.ReactNode;
}

const statusText: Record<GovernanceStatus, string> = {
  ACCEPTED: "has been accepted",
  REFUSED: "has been refused",
  REMOVED: "has been removed",
  EXPIRED: "has expired",
};

const statusColor: Record<GovernanceStatus, string> = {
  ACCEPTED: "text-green-400",
  REFUSED: "text-red-400",
  REMOVED: "text-rose-400",
  EXPIRED: "text-yellow-400",
};

export function GovernanceStatusNotOpen(
  props: Readonly<GovernanceStatusNotOpenProps>,
) {
  const { governanceModel, status, children } = props;

  return (
    <Card className="rounded-radius flex flex-col p-6 gap-6">
      <span className={` ${statusColor[status]}`}>
        This {governanceModel} {statusText[status]}.
      </span>
      {children}
    </Card>
  );
}
