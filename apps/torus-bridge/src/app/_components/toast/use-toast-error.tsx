import { errorToString } from "@hyperlane-xyz/utils";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { logger } from "~/utils/logger";
import { useEffect } from "react";

export function useToastError(error: unknown, errorMsg?: string) {
  const { toast } = useToast();
  useEffect(() => {
    if (!error) return;
    const message = errorMsg ?? errorToString(error, 500);
    logger.error(message, error);
    toast({ title: "...", description: message });
  }, [error, errorMsg, toast]);
}
