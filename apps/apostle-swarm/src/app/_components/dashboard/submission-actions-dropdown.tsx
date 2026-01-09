"use client";

import type { Prospect } from "@torus-ts/db/schema";
import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { api } from "~/trpc/react";
import { CheckCircle, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";

interface SubmissionActionsDropdownProps {
  prospect: Prospect;
  isApostle: boolean;
}

export function SubmissionActionsDropdown({
  prospect,
  isApostle,
}: SubmissionActionsDropdownProps) {
  const utils = api.useUtils();

  const approveMutation = api.apostleSwarm.approveProspect.useMutation({
    onSuccess: () => {
      toast.success(`Approved @${prospect.xHandle}`);
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejectMutation = api.apostleSwarm.rejectProspect.useMutation({
    onSuccess: () => {
      toast.success(`Rejected @${prospect.xHandle}`);
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // Only apostles can approve/reject, and only PENDING submissions
  const canModerate = isApostle && prospect.approvalStatus === "PENDING";

  if (!canModerate) {
    return null;
  }

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => approveMutation.mutate({ prospectId: prospect.id })}
          disabled={approveMutation.isPending}
          className="text-green-400"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Approve
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => rejectMutation.mutate({ prospectId: prospect.id })}
          disabled={rejectMutation.isPending}
          className="text-red-400"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
