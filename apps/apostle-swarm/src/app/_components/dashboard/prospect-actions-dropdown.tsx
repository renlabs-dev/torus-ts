"use client";

import type { Apostle, Prospect } from "@torus-ts/db/schema";
import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { api } from "~/trpc/react";
import {
  CheckCircle,
  MoreHorizontal,
  RefreshCw,
  Tag,
  UserPlus,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ProspectActionsDropdownProps {
  prospect: Prospect;
  isApostle: boolean;
  isAdmin: boolean;
  apostle: Apostle | null;
}

const QUALITY_TAGS = [
  { value: "HIGH_POTENTIAL", label: "High Potential" },
  { value: "MID_POTENTIAL", label: "Mid Potential" },
  { value: "LOW_POTENTIAL", label: "Low Potential" },
  { value: "BAD_PROSPECT", label: "Bad Prospect" },
  { value: "UNRATED", label: "Unrated" },
] as const;

export function ProspectActionsDropdown({
  prospect,
  isApostle,
  isAdmin,
  apostle,
}: ProspectActionsDropdownProps) {
  const utils = api.useUtils();

  const claimMutation = api.apostleSwarm.claimProspect.useMutation({
    onSuccess: () => {
      toast.success(`Claimed @${prospect.xHandle}`);
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const setQualityTagMutation = api.apostleSwarm.setQualityTag.useMutation({
    onSuccess: () => {
      toast.success("Quality tag updated");
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const triggerConversionCheckMutation =
    api.apostleSwarm.triggerConversionCheck.useMutation({
      onSuccess: () => {
        toast.success("Conversion check queued");
        void utils.apostleSwarm.listProspects.invalidate();
      },
      onError: (error) => toast.error(error.message),
    });

  const markConvertedMutation = api.apostleSwarm.markConverted.useMutation({
    onSuccess: () => {
      toast.success(`Marked @${prospect.xHandle} as converted`);
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const markFailedMutation = api.apostleSwarm.markFailed.useMutation({
    onSuccess: () => {
      toast.success(`Marked @${prospect.xHandle} as failed`);
      void utils.apostleSwarm.listProspects.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  // Determine available actions based on role and prospect state
  const canClaim = isApostle && prospect.claimStatus === "UNCLAIMED";
  const canSetQualityTag = isApostle && prospect.claimStatus === "UNCLAIMED";
  const isClaimedByMe =
    apostle !== null && prospect.claimedByApostleId === apostle.id;
  const canTriggerConversionCheck =
    prospect.claimStatus === "CLAIMED" && (isClaimedByMe || isAdmin);
  const canMarkOutcome =
    prospect.claimStatus === "CLAIMED" && (isClaimedByMe || isAdmin);

  const isPending =
    claimMutation.isPending ||
    setQualityTagMutation.isPending ||
    triggerConversionCheckMutation.isPending ||
    markConvertedMutation.isPending ||
    markFailedMutation.isPending;

  // If not an apostle, don't show the menu at all
  if (!isApostle) {
    return null;
  }

  // If no actions available
  const hasActions =
    canClaim || canSetQualityTag || canTriggerConversionCheck || canMarkOutcome;

  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="renaissance-dropdown">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {canClaim && (
          <DropdownMenuItem
            onClick={() => claimMutation.mutate({ prospectId: prospect.id })}
            disabled={claimMutation.isPending}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Claim Prospect
          </DropdownMenuItem>
        )}

        {canSetQualityTag && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Tag className="mr-2 h-4 w-4" />
              Set Quality Tag
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="renaissance-dropdown">
              {QUALITY_TAGS.map((tag) => (
                <DropdownMenuItem
                  key={tag.value}
                  onClick={() =>
                    setQualityTagMutation.mutate({
                      prospectId: prospect.id,
                      qualityTag: tag.value,
                    })
                  }
                  disabled={setQualityTagMutation.isPending}
                >
                  {tag.label}
                  {prospect.qualityTag === tag.value && (
                    <CheckCircle className="ml-auto h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {canTriggerConversionCheck && (
          <DropdownMenuItem
            onClick={() =>
              triggerConversionCheckMutation.mutate({ prospectId: prospect.id })
            }
            disabled={triggerConversionCheckMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Conversion
          </DropdownMenuItem>
        )}

        {canMarkOutcome && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                markConvertedMutation.mutate({ prospectId: prospect.id })
              }
              disabled={markConvertedMutation.isPending}
              className="text-green-400"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Converted
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                markFailedMutation.mutate({ prospectId: prospect.id })
              }
              disabled={markFailedMutation.isPending}
              className="text-red-400"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Mark Failed
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
