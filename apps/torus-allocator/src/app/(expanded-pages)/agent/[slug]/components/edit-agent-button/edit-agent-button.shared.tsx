import { Button } from "@torus-ts/ui/components/button";
import { TooltipContent } from "@torus-ts/ui/components/tooltip";
import { Pencil } from "lucide-react";
import Link from "next/link";

interface EditAgentOwnerButtonProps {
  agentKey: string;
  className: string;
}

interface EditAgentNonOwnerButtonProps {
  className: string;
}

function EditAgentButtonContent() {
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
  agentKey,
  className,
}: EditAgentOwnerButtonProps) => (
  <Button asChild variant="outline" className={className}>
    <Link href={`/agent/${agentKey}/edit`}>
      <EditAgentButtonContent />
    </Link>
  </Button>
);

export const EditAgentNonOwnerButton = ({
  className,
}: EditAgentNonOwnerButtonProps) => (
  <Button variant="outline" className={className} disabled>
    <EditAgentButtonContent />
  </Button>
);
