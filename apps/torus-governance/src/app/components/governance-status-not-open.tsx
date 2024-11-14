import { Card } from "@torus-ts/ui";

type GovernanceStatus = "ACCEPTED" | "REFUSED" | "REMOVED" | "EXPIRED";
interface GovernanceStatusNotOpenProps {
  governanceModel: string;
  status: GovernanceStatus;
}

const statusText: Record<GovernanceStatus, string> = {
  ACCEPTED: "have been accepted",
  REFUSED: "have been refused",
  REMOVED: "have been removed",
  EXPIRED: "have expired",
};

export function GovernanceStatusNotOpen(
  props: GovernanceStatusNotOpenProps,
): JSX.Element {
  const { governanceModel, status } = props;

  return (
    <Card className="rounded-md px-4 py-2">
      <span className="font-semibold text-white">
        This {governanceModel} {statusText[status]}.
      </span>
    </Card>
  );
}
