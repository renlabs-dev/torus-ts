"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { deregisterAgent } from "@torus-network/sdk/chain";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Trash2 } from "lucide-react";

import { DeregisterAgentDialog } from "./deregister-agent-dialog";

interface DeregisterAgentButtonProps {
  agentName: string;
}

export function DeregisterAgentButton({
  agentName,
}: DeregisterAgentButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { api, selectedAccount, torusApi, wsEndpoint } = useTorus();
  const { web3FromAddress } = torusApi;
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Deregister Agent",
  });

  const handleDeregister = async () => {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    await sendTx(deregisterAgent(api));

    // todo refetch handler
    const todoRefetcher = true;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (todoRefetcher) {
      setIsDialogOpen(false);
      // Redirect to agents list or home after successful deregistration
      router.push("/root-allocator");
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        Deregister Agent
      </Button>

      <DeregisterAgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agentName={agentName}
        onConfirm={handleDeregister}
        isDeregistering={isPending}
      />
    </>
  );
}
