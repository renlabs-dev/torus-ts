"use client";

import { deregisterAgent } from "@torus-network/sdk/chain";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Deregister Agent",
  });

  const handleDeregister = async () => {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const [sendErr, sendRes] = await sendTx(deregisterAgent(api));

    if (sendErr !== undefined) {
      return; // Error already handled by sendTx
    }

    const { tracker } = sendRes;

    tracker.on("finalized", () => {
      setIsDialogOpen(false);
      // Redirect to agents list or home after successful deregistration
      router.push("/root-allocator");
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
        disabled={isPending || isSigning}
      >
        <Trash2 className="h-4 w-4" />
        Deregister Agent
      </Button>

      <DeregisterAgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agentName={agentName}
        onConfirm={handleDeregister}
        isDeregistering={isPending || isSigning}
      />
    </>
  );
}
