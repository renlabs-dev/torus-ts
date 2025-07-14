"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import type { CID } from "@torus-network/torus-utils/ipfs";
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
  const { selectedAccount, isAccountConnected, isInitialized } = useTorus();
  const [iconCid, setIconCid] = useState<CID | null>(null);

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

  async function onSubmit(data: z.infer<typeof REGISTER_AGENT_SCHEMA>) {
    const { data: result, error } = await tryCatch(
      doMetadataPin(data, iconCid),
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    if (result.cid) {
      console.info("Pinned metadata at:", cidToIpfsUri(result.cid));
      form.reset();
      setIconCid(null);
      toast.success(
        "Success! Metadata pinned to IPFS. Submit functionality is disabled but the form behaves as expected",
      );
    }
  }

  const formValues = form.watch();

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(onSubmit)}
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

          <RegisterAgentIconField
            control={form.control}
            onIconPinned={setIconCid}
          />

          <PortalFormSeparator title="Social Information (Optional)" />

          <RegisterAgentSocialsFields control={form.control} />

          <PortalFormSeparator title="Preview" />

          <RegisterAgentPreview formValues={formValues} />

          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={!isAccountConnected}
          >
            Register Agent
          </Button>
        </div>
      </form>
    </Form>
  );
}
