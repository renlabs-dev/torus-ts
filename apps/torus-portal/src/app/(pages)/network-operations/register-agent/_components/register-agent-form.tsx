"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { checkSS58 } from "@torus-network/sdk";
import { cidToIpfsUri } from "@torus-network/torus-utils/ipfs";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { WalletConnectionWarning } from "@torus-ts/ui/components/wallet-connection-warning";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { PortalFormSeparator } from "~/app/_components/portal-form-separator";
import { tryCatch } from "~/utils/try-catch";

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
    selectedAccount,
    isAccountConnected,
    isInitialized,
    registerAgentTransaction,
  } = useTorus();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const form = useForm<RegisterAgentFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(REGISTER_AGENT_SCHEMA),
    mode: "onChange",
    defaultValues: {
      agentKey: "",
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

  async function handleSubmit(data: z.infer<typeof REGISTER_AGENT_SCHEMA>) {
    setTransactionStatus("loading");

    // First, pin the metadata (and icon if present) to IPFS
    const { data: metadataResult, error: metadataError } = await tryCatch(
      doMetadataPin(data, data.icon),
    );

    if (metadataError) {
      console.error("Error pinning metadata:", metadataError);
      setTransactionStatus("error");
      toast.error(metadataError.message);
      return;
    }

    if (!metadataResult.cid) {
      setTransactionStatus("error");
      toast.error("Failed to pin metadata to IPFS");
      return;
    }

    console.info("Pinned metadata at:", cidToIpfsUri(metadataResult.cid));

    // Parse agent key and URL
    const parsedAgentKey = checkSS58(data.agentKey);
    const parsedAgentApiUrl =
      !data.agentApiUrl || data.agentApiUrl.trim() === ""
        ? "null:"
        : data.agentApiUrl;

    // Execute the transaction
    const { error } = await tryCatch(
      registerAgentTransaction({
        agentKey: parsedAgentKey,
        name: data.name,
        url: parsedAgentApiUrl,
        metadata: cidToIpfsUri(metadataResult.cid),
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            form.reset();
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to register agent");
          }
        },
      }),
    );

    if (error) {
      console.error("Error registering agent:", error);
      setTransactionStatus("error");
      toast.error("Failed to register agent");
      return;
    }
  }

  const formValues = form.watch();

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

        <div className="grid gap-6 max-w-2xl">
          <RegisterAgentInfoFields
            control={form.control}
            setValue={form.setValue}
            selectedAccount={selectedAccount}
            formValues={formValues}
          />

          <RegisterAgentIconField control={form.control} />

          <PortalFormSeparator title="Social Information (Optional)" />

          <RegisterAgentSocialsFields control={form.control} />

          <PortalFormSeparator title="Preview" />

          <RegisterAgentPreview formValues={formValues} />

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={!isAccountConnected || transactionStatus === "loading"}
          >
            {transactionStatus === "loading"
              ? "Registering..."
              : "Register Agent"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
