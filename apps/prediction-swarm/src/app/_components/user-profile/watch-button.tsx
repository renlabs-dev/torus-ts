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
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface WatchButtonProps {
  userId: string;
}

export function WatchButton({ userId }: WatchButtonProps) {
  const { selectedAccount } = useTorus();
  const { toast } = useToast();
  const utils = api.useUtils();

  const isConnected = !!selectedAccount?.address;

  const { data: watchStatus, isLoading: isLoadingStatus } =
    api.watch.getWatchStatus.useQuery(
      { userId },
      {
        enabled: isConnected,
      },
    );

  const watchMutation = api.watch.watch.useMutation({
    onMutate: async () => {
      // Cancel outgoing refetches
      await utils.watch.getWatchStatus.cancel({ userId });
      await utils.watch.getWatcherCount.cancel({ userId });

      // Snapshot previous values
      const previousStatus = utils.watch.getWatchStatus.getData({ userId });
      const previousCount = utils.watch.getWatcherCount.getData({ userId });

      // Optimistically update
      utils.watch.getWatchStatus.setData({ userId }, { isWatching: true });
      utils.watch.getWatcherCount.setData({ userId }, (old) => (old ?? 0) + 1);

      return { previousStatus, previousCount };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousStatus) {
        utils.watch.getWatchStatus.setData({ userId }, context.previousStatus);
      }
      if (context?.previousCount !== undefined) {
        utils.watch.getWatcherCount.setData({ userId }, context.previousCount);
      }
      toast({
        title: "Failed to watch",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void utils.watch.getWatchStatus.invalidate({ userId });
      void utils.watch.getWatcherCount.invalidate({ userId });
      void utils.watch.getWatchedCount.invalidate();
    },
  });

  const unwatchMutation = api.watch.unwatch.useMutation({
    onMutate: async () => {
      await utils.watch.getWatchStatus.cancel({ userId });
      await utils.watch.getWatcherCount.cancel({ userId });

      const previousStatus = utils.watch.getWatchStatus.getData({ userId });
      const previousCount = utils.watch.getWatcherCount.getData({ userId });

      utils.watch.getWatchStatus.setData({ userId }, { isWatching: false });
      utils.watch.getWatcherCount.setData({ userId }, (old) =>
        Math.max((old ?? 1) - 1, 0),
      );

      return { previousStatus, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStatus) {
        utils.watch.getWatchStatus.setData({ userId }, context.previousStatus);
      }
      if (context?.previousCount !== undefined) {
        utils.watch.getWatcherCount.setData({ userId }, context.previousCount);
      }
      toast({
        title: "Failed to unwatch",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      void utils.watch.getWatchStatus.invalidate({ userId });
      void utils.watch.getWatcherCount.invalidate({ userId });
      void utils.watch.getWatchedCount.invalidate();
    },
  });

  const isWatching = watchStatus?.isWatching ?? false;
  const isLoading =
    isLoadingStatus || watchMutation.isPending || unwatchMutation.isPending;

  const handleClick = () => {
    if (!isConnected) return;

    if (isWatching) {
      unwatchMutation.mutate({ userId });
    } else {
      watchMutation.mutate({ userId });
    }
  };

  const button = (
    <Button
      variant={isWatching ? "secondary" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={!isConnected || isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isWatching ? (
        <EyeOff className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      {isWatching ? "Watching" : "Watch"}
    </Button>
  );

  if (!isConnected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>Connect wallet to watch this predictor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
