"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { registerAgent } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { cidToIpfsUri } from "@torus-network/torus-utils/ipfs";
import { useAgents } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { DestructiveAlertWithDescription } from "@torus-ts/ui/components/destructive-alert-with-description";
import { Form } from "@torus-ts/ui/components/form";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { FeeTooltip } from "~/app/_components/fee-tooltip";
import PortalFormHeader from "~/app/_components/portal-form-header";
import { PortalFormSeparator } from "~/app/_components/portal-form-separator";
import { useAgentRegistrationFee } from "~/hooks/use-agent-registration-fee";
import { tryCatch } from "~/utils/try-catch";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { RegisterAgentIconField } from "./register-agent-icon-field";
import { RegisterAgentInfoFields } from "./register-agent-info-fields";
import { RegisterAgentPreview } from "./register-agent-preview";
import type { RegisterAgentFormData } from "./register-agent-schema";
import { REGISTER_AGENT_SCHEMA } from "./register-agent-schema";
import { RegisterAgentSocialsFields } from "./register-agent-socials-fields";
import { doMetadataPin } from "./register-agent-utils";

export function RegisterAgentForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const { toast } = useToast();
  const {
    api,
    selectedAccount,
    isAccountConnected,
    isInitialized,
    torusApi,
    wsEndpoint,
  } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Register Agent",
  });

  const form = useForm<RegisterAgentFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(REGISTER_AGENT_SCHEMA),
    mode: "onChange",
    defaultValues: {
      agentApiUrl: "",
      name: "",
      shortDescription: "",
      body: "",
      twitter: "",
      github: "",
      telegram: "",
      discord: "",
      website: "",
      icon: undefined,
    },
  });

  const agents = useAgents(api);

  const isAlreadyRegistered = selectedAccount?.address
    ? agents.data?.has(selectedAccount.address as SS58Address)
    : false;

  async function handleSubmit(data: z.infer<typeof REGISTER_AGENT_SCHEMA>) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    // First, pin the metadata (and icon if present) to IPFS
    const { data: metadataResult, error: metadataError } = await tryCatch(
      doMetadataPin(data, data.icon),
    );

    if (metadataError) {
      console.error("Error pinning metadata:", metadataError);
      toast.error(metadataError.message);
      return;
    }

    if (!metadataResult.cid) {
      toast.error("Failed to pin metadata to IPFS");
      return;
    }

    console.info("Pinned metadata at:", cidToIpfsUri(metadataResult.cid));

    // Parse URL
    const parsedAgentApiUrl =
      !data.agentApiUrl || data.agentApiUrl.trim() === ""
        ? "null:"
        : data.agentApiUrl;

    const [sendErr, sendRes] = await sendTx(
      registerAgent({
        api,
        name: data.name,
        url: parsedAgentApiUrl,
        metadata: cidToIpfsUri(metadataResult.cid),
      }),
    );

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      form.reset();
    });
  }

  const formValues = form.watch();

  const agentRegistrationFee = useAgentRegistrationFee(
    api,
    selectedAccount?.address as SS58Address,
    formValues.name,
  );

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <PortalFormHeader
          title="Register Agent"
          description="Register your agent to the Torus Network."
        />

        <WalletConnectionWarning
          isAccountConnected={isAccountConnected}
          isInitialized={isInitialized}
        />

        {isAlreadyRegistered && (
          <DestructiveAlertWithDescription
            title="Agent Already Registered"
            description="The connected account is already registered as an agent."
          />
        )}

        <div className="grid max-w-3xl gap-6">
          <RegisterAgentInfoFields control={form.control} />

          <RegisterAgentIconField control={form.control} />

          <PortalFormSeparator title="Social Information (Optional)" />

          <RegisterAgentSocialsFields control={form.control} />

          <PortalFormSeparator title="Preview" />

          <RegisterAgentPreview formValues={formValues} />

          <FeeTooltip
            title="Agent Registration Fee"
            isVisible={Boolean(
              isAccountConnected &&
                formValues.name &&
                formValues.name.trim().length > 0 &&
                !isPending,
            )}
            isLoading={agentRegistrationFee.isLoading}
            error={agentRegistrationFee.error}
            feeItems={agentRegistrationFee.feeItems}
            totalAmount={agentRegistrationFee.totalAmount}
            note="The capability deposit can be reclaimed when the agent capability is deleted."
          />

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={
              !isAccountConnected ||
              isPending ||
              isSigning ||
              isAlreadyRegistered
            }
          >
            {isPending ? "Registering..." : "Register Agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
