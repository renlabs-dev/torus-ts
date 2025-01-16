import { Card } from "@torus-ts/ui";

type GovernanceStatus = "ACCEPTED" | "REFUSED" | "REMOVED" | "EXPIRED";
interface GovernanceStatusNotOpenProps {
  governanceModel: string;
  status: GovernanceStatus;
  children?: React.ReactNode;
}

const statusText: Record<GovernanceStatus, string> = {
  ACCEPTED: "have been accepted",
  REFUSED: "have been refused",
  REMOVED: "have been removed",
  EXPIRED: "have expired",
};

const statusColor: Record<GovernanceStatus, string> = {
  ACCEPTED: "text-green-400",
  REFUSED: "text-red-400",
  REMOVED: "text-rose-400",
  EXPIRED: "text-yellow-400",
};

export function GovernanceStatusNotOpen(
  props: GovernanceStatusNotOpenProps,
): JSX.Element {
  const { governanceModel, status, children } = props;

  return (
    <Card className="rounded-radius flex flex-col p-4">
      <span className={`font-semibold ${statusColor[status]}`}>
        This {governanceModel} {statusText[status]}.
      </span>
      {children}
    </Card>
  );
}
