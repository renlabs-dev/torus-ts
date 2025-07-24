"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { lazy, Suspense, useState, useRef } from "react";
import { UpdateAgentCoreButton } from "../update-agent-button";

const UpdateAgentDialog = lazy(() => import("./update-agent-dialog"));

interface UpdateAgentDialogButtonProps {
  agentKey: string;
}

export function UpdateAgentDialogButton({
  agentKey,
}: UpdateAgentDialogButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleDialogChangeRef = useRef<((open: boolean) => void) | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (handleDialogChangeRef.current) {
      handleDialogChangeRef.current(open);
    } else {
      setIsOpen(open);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <UpdateAgentCoreButton variant="owner" />
      </DialogTrigger>
      <DialogContent className="md:max-w-[720px] lg:max-w-[1200px] max-h-[80vh] overflow-y-auto p-6">
        <DialogTitle className="sr-only">Update Agent</DialogTitle>
        <Suspense fallback={<div>Loading...</div>}>
          <UpdateAgentDialog
            agentKey={agentKey}
            setIsOpen={setIsOpen}
            handleDialogChangeRef={handleDialogChangeRef}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
