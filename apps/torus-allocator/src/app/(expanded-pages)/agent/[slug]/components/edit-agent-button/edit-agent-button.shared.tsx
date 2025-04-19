import { Button } from "@torus-ts/ui/components/button";
import { TooltipContent } from "@torus-ts/ui/components/tooltip";
import { Pencil } from "lucide-react";

interface EditAgentOwnerButtonProps {
  agentKey: string;
  className: string;
  onClick?: () => void;
}

interface EditAgentNonOwnerButtonProps {
  className: string;
}

export function EditAgentButtonContent() {
  return (
    <>
      <Pencil className="mr-2 h-4 w-4" />
      Edit Agent Info
    </>
  );
}

export function EditAgentNonOwnerTooltip() {
  return (
    <TooltipContent>
      <p>Only the agent owner can edit agent information</p>
    </TooltipContent>
  );
}

export const EditAgentOwnerButton = ({
  className,
  onClick,
}: EditAgentOwnerButtonProps) => (
  <Button
    variant="outline"
    className={className}
    onClick={onClick}
  >
    <EditAgentButtonContent />
  </Button>
);

export const EditAgentNonOwnerButton = ({
  className,
}: EditAgentNonOwnerButtonProps) => (
  <Button variant="outline" className={className} disabled>
    <EditAgentButtonContent />
  </Button>
);
