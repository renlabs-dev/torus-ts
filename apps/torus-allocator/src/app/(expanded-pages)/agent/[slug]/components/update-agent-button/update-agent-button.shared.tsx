import { Button } from "@torus-ts/ui/components/button";
import { TooltipContent } from "@torus-ts/ui/components/tooltip";
import { Pencil } from "lucide-react";

interface UpdateAgentOwnerButtonProps {
  agentKey: string;
  className: string;
  onClick?: () => void;
}

interface UpdateAgentNonOwnerButtonProps {
  className: string;
}

export function UpdateAgentButtonContent() {
  return (
    <>
      <Pencil className="mr-2 h-4 w-4" />
      Update Agent Info
    </>
  );
}

export function UpdateAgentNonOwnerTooltip() {
  return (
    <TooltipContent>
      <p>Only the agent owner can update agent information</p>
    </TooltipContent>
  );
}

export const UpdateAgentOwnerButton = ({
  className,
  onClick,
}: UpdateAgentOwnerButtonProps) => (
  <Button
    variant="outline"
    className={className}
    onClick={onClick}
    aria-label="Edit agent information"
  >
    <UpdateAgentButtonContent />
  </Button>
);

export const UpdateAgentNonOwnerButton = ({
  className,
}: UpdateAgentNonOwnerButtonProps) => (
  <Button
    variant="outline"
    className={className}
    disabled
    aria-label="Edit agent information"
    aria-disabled="true"
  >
    <UpdateAgentButtonContent />
  </Button>
);
