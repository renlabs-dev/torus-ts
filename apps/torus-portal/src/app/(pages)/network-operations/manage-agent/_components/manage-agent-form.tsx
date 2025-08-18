"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { DestructiveAlertWithDescription } from "@torus-ts/ui/components/destructive-alert-with-description";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { api } from "~/trpc/react";

import { UpdateAgentForm } from "./update-agent-form";

export function ManageAgentForm() {
  const { selectedAccount, isAccountConnected } = useTorus();

  const { data: agent, isLoading: isLoadingAgent } =
    api.agent.byKeyLastBlock.useQuery(
      { key: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address },
    );

  if (!isAccountConnected || !selectedAccount?.address) {
    return (
      <>
        <PortalFormHeader
          title="Manage Agent"
          description="Update your agent's information, including name, description, and social links."
        />
        <div className="h-4" />
        <WalletConnectionWarning isAccountConnected={isAccountConnected} />
      </>
    );
  }

  if (isLoadingAgent) {
    return (
      <>
        <PortalFormHeader
          title="Manage Agent"
          description="Update your agent's information, including name, description, and social links."
        />
        <div className="h-4" />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">
            Loading agent information...
          </div>
        </div>
      </>
    );
  }

  if (!agent) {
    return (
      <>
        <PortalFormHeader
          title="Manage Agent"
          description="Update your agent's information, including name, description, and social links."
        />
        <div className="h-4" />
        <DestructiveAlertWithDescription
          title="No agent found"
          description="You don't have an agent registered with this account. Please register an agent first before managing its information."
        />
      </>
    );
  }

  return (
    <>
      <PortalFormHeader
        title="Manage Agent"
        description="Update your agent's information, including name, description, and social links."
      />
      <div className="h-4" />
      <UpdateAgentForm agentKey={selectedAccount.address} />
    </>
  );
}
