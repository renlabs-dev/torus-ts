"use client";

import { useMemo } from "react";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomAgentApplications } from "~/utils";
import { match } from "rustie";
import type { AgentApplication, SS58Address } from "@torus-network/sdk";

// Common function to map status values
export const mapStatusToView = (status: AgentApplication["status"]): string => {
  return match(status)({
    Open: () => "active",
    Resolved: ({ accepted }: { accepted: boolean }) =>
      accepted ? "accepted" : "refused",
    Expired: () => "expired",
  });
};

interface UseAgentApplicationsOptions {
  filterByStatus?: "Open" | "Resolved" | "Expired" | null;
  limit?: number;
  search?: string | null;
  statusFilter?: string | null;
}

interface ApplicationResult {
  id: number;
  title: string | null;
  body: string;
  status: string;
  agentKey: SS58Address;
  payerKey: SS58Address;
  rawStatus: AgentApplication["status"];
  isActiveAgent: boolean | undefined;
}

export const useAgentApplications = (options: UseAgentApplicationsOptions = {}) => {
  const {
    agentApplicationsWithMeta,
    agentApplications,
    isInitialized,
    agents,
  } = useGovernance();

  const isLoading =
    !agentApplicationsWithMeta ||
    agentApplications.isPending ||
    !isInitialized ||
    agents.isPending;

  const filteredApplications = useMemo(() => {
    if (!agentApplicationsWithMeta) return [];

    const { filterByStatus, limit, search, statusFilter } = options;

    // Create a stable copy in reverse order (newest first)
    const reversedApplications = [...agentApplicationsWithMeta].reverse();

    return reversedApplications
      .filter((app) => {
        // Filter by application status if specified
        if (filterByStatus) {
          const isMatch = match(app.status)({
            Open: () => filterByStatus === "Open",
            Resolved: () => filterByStatus === "Resolved",
            Expired: () => filterByStatus === "Expired",
          });
          
          if (!isMatch) return false;
        }

        // Get application title and body
        const { title, body } = handleCustomAgentApplications(
          app.id,
          app.customData ?? null,
        );

        if (!body) return false;

        const status = mapStatusToView(app.status);

        // Filter by search term if provided
        const matchesSearch =
          !search ||
          (title?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
          body.toLowerCase().includes(search.toLowerCase()) ||
          app.payerKey.toLowerCase().includes(search.toLowerCase()) ||
          app.agentKey.toLowerCase().includes(search.toLowerCase());

        // Filter by status if provided
        const matchesStatus =
          !statusFilter || statusFilter === "all" || status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .map((app) => {
        const { title, body } = handleCustomAgentApplications(
          app.id,
          app.customData ?? null,
        );

        // This should never happen as we filter earlier, but to keep TypeScript happy
        if (!body) return null;

        const status = mapStatusToView(app.status);
        const isActiveAgent = agents.data?.has(app.agentKey);

        return {
          id: app.id,
          title,
          body,
          status,
          agentKey: app.agentKey,
          payerKey: app.payerKey,
          rawStatus: app.status,
          isActiveAgent,
        } as ApplicationResult;
      })
      .filter(Boolean as unknown as (value: ApplicationResult | null) => value is ApplicationResult)
      .slice(0, limit ?? undefined);
  }, [
    agentApplicationsWithMeta,
    agents.data,
    options,
  ]);

  return {
    applications: filteredApplications,
    isLoading,
    error: agents.error,
  };
};