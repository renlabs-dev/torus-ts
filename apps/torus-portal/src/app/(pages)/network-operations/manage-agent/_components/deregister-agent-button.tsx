"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import type { TransactionResult } from "@torus-ts/ui/components/transaction-status";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { Trash2 } from "lucide-react";

import { DeregisterAgentDialog } from "./deregister-agent-dialog";

interface DeregisterAgentButtonProps {
  agentName: string;
}

export function DeregisterAgentButton({
  agentName,
}: DeregisterAgentButtonProps) {
  const router = useRouter();
  const { deregisterAgentTransaction } = useTorus();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeregistering, setIsDeregistering] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const handleDeregister = async () => {
    setIsDeregistering(true);

    await deregisterAgentTransaction({
      callback: (tx) => {
        if (tx.status === "SUCCESS" && !tx.message?.includes("included")) {
          setIsDialogOpen(false);
          setIsDeregistering(false);
          // Redirect to agents list or home after successful deregistration
          router.push("/root-allocator");
        }

        if (tx.status === "ERROR") {
          setIsDeregistering(false);
        }

        setTransactionStatus(tx);
      },
      refetchHandler: () => {
        // Optionally refresh data after transaction
        return Promise.resolve(router.refresh());
      },
    });
  };

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setIsDialogOpen(true)}
        className="flex items-center gap-2"
        disabled={isDeregistering}
      >
        <Trash2 className="h-4 w-4" />
        Deregister Agent
      </Button>

      <DeregisterAgentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        agentName={agentName}
        onConfirm={handleDeregister}
        isDeregistering={isDeregistering}
      />

      {transactionStatus.status && (
        <div className="mt-4">
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        </div>
      )}
    </>
  );
}
