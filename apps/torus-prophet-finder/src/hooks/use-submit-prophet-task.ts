"use client";

import type { SwarmMemory } from "@torus-network/torus-utils/swarm-memory-client";
import { useSwarmMemory } from "~/contexts/swarm-memory-provider";
import * as React from "react";

interface SubmitProphetTaskResult {
  submit: (username: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useSubmitProphetTask(): SubmitProphetTaskResult {
  const swarmContext = useSwarmMemory();
  const client: SwarmMemory | null = swarmContext.client;
  const isInitializing = swarmContext.isInitializing;
  const initError = swarmContext.initError;
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const submit = React.useCallback(
    async (username: string) => {
      if (!client) {
        setError(
          initError ||
            "SwarmMemory client not initialized. Please connect your wallet.",
        );
        return;
      }

      if (isInitializing) {
        setError("Initializing SwarmMemory client...");
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(false);

      try {
        await client.tasks.createTask({
          task_type: "ScrapeAllTweetsOfUser",
          value: username,
        });

        setSuccess(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit scrape task";
        setError(message);
        console.error("Error submitting prophet task:", err);
      } finally {
        setLoading(false);
      }
    },
    [client, isInitializing, initError],
  );

  return {
    submit,
    loading,
    error,
    success,
  };
}
