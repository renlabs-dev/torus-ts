"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { api } from "~/trpc/react";
import { Loader2, Star } from "lucide-react";

interface StarButtonProps {
  tweetId: string;
}

export function StarButton({ tweetId }: StarButtonProps) {
  const { selectedAccount } = useTorus();
  const { toast } = useToast();
  const utils = api.useUtils();

  const isConnected = !!selectedAccount?.address;
  const userKey = selectedAccount?.address ?? "";

  const { data: starStatus, isLoading: isLoadingStatus } =
    api.star.getStarStatus.useQuery(
      { tweetId, userKey },
      {
        enabled: isConnected,
      },
    );

  const starMutation = api.star.star.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.star.getStarStatus.cancel({ tweetId, userKey });

      // Snapshot previous values
      const previousStatus = utils.star.getStarStatus.getData({
        tweetId,
        userKey,
      });

      // Optimistically update
      utils.star.getStarStatus.setData(
        { tweetId, userKey },
        { isStarred: true },
      );

      return { previousStatus };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        utils.star.getStarStatus.setData(
          { tweetId, userKey },
          context.previousStatus,
        );
      }
      toast({
        title: "Failed to star",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void utils.star.getStarStatus.invalidate({ tweetId, userKey });
      void utils.star.getStarredCount.invalidate({ userKey });
    },
  });

  const unstarMutation = api.star.unstar.useMutation({
    onMutate: async () => {
      await utils.star.getStarStatus.cancel({ tweetId, userKey });

      const previousStatus = utils.star.getStarStatus.getData({
        tweetId,
        userKey,
      });

      utils.star.getStarStatus.setData(
        { tweetId, userKey },
        { isStarred: false },
      );

      return { previousStatus };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatus) {
        utils.star.getStarStatus.setData(
          { tweetId, userKey },
          context.previousStatus,
        );
      }
      toast({
        title: "Failed to unstar",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void utils.star.getStarStatus.invalidate({ tweetId, userKey });
      void utils.star.getStarredCount.invalidate({ userKey });
    },
  });

  const isStarred = starStatus?.isStarred ?? false;
  const isLoading =
    isLoadingStatus || starMutation.isPending || unstarMutation.isPending;

  const handleClick = () => {
    if (!isConnected) return;

    if (isStarred) {
      unstarMutation.mutate({ tweetId });
    } else {
      starMutation.mutate({ tweetId });
    }
  };

  const button = (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={!isConnected || isLoading}
      className="h-8 w-8"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star
          className={`h-4 w-4 ${isStarred ? "fill-yellow-500 text-yellow-500" : ""}`}
        />
      )}
    </Button>
  );

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>Connect wallet to star this prediction</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{isStarred ? "Remove from starred" : "Add to starred"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
