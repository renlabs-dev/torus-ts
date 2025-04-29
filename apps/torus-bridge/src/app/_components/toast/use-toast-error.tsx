import { errorToString } from "@hyperlane-xyz/utils";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { logger } from "~/utils/logger";
import { useEffect } from "react";

export function useToastError(error: unknown, errorMsg?: string) {
  const { toast } = useToast();
  useEffect(() => {
    if (!error) return;

    // Convert error to string once to avoid recreating objects
    const message = errorMsg ?? errorToString(error, 500);
    logger.error(message, error);

    // Show the toast message
    toast.error(message);

    // Include toast in dependencies to avoid lint warning while keeping functionality
  }, [error, errorMsg, toast]);
}
